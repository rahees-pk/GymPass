import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { createCheckInRequest } from "../../api/checkins";
import { fetchGymById } from "../../api/publicGyms";
import { getErrorMessage } from "../../utils/errorMessage";

const SCANNER_ELEMENT_ID = "gympass-qr-scanner";
// Gives the OS a moment to actually release the camera hardware after
// stop()/clear() resolve, before attempting to open it again. This is
// a practical mitigation for a well-known getUserMedia race, not a
// html5-qrcode-specific workaround.
const CAMERA_RELEASE_DELAY_MS = 300;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isHardwareBusyError = (err) => {
  const name = err?.name || "";
  return (
    name === "NotReadableError" ||
    name === "TrackStartError" ||
    name === "OverconstrainedError" ||
    name === "AbortError"
  );
};

const isPermissionError = (err) => {
  const name = err?.name || "";
  return name === "NotAllowedError" || /permission/i.test(String(err));
};

// "idle" | "starting" | "scanning" | "processing" | "success" | "error" | "camera-denied"
const ScanGymQR = () => {
  const [scanState, setScanState] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [checkedInGym, setCheckedInGym] = useState(null);
  const [checkInTime, setCheckInTime] = useState(null);

  // The DOM node with id={SCANNER_ELEMENT_ID} below is owned EXCLUSIVELY
  // by html5-qrcode once a scan session starts. React never renders any
  // children inside it — this is the fix that resolved the earlier
  // removeChild conflict, and it must stay this way.
  const scannerContainerRef = useRef(null);

  const html5QrCodeRef = useRef(null);
  const scannerPhaseRef = useRef("idle"); // "idle" | "starting" | "running" | "stopping"
  const startPromiseRef = useRef(null); // the in-flight startScanner() attempt, if any
  const isProcessingRef = useRef(false); // guards duplicate decode callbacks
  const isMountedRef = useRef(true);

  // Incremented on every startScanner() call and on unmount/cancel.
  // Any async step checks this against the value it captured when it
  // began, so a stale attempt (superseded by a rapid re-click, a
  // cancel, or an unmount) can detect it's obsolete and back out
  // cleanly instead of fighting a newer attempt for camera ownership.
  const generationRef = useRef(0);

  const stopInstance = async (instance) => {
    if (!instance) return;
    try {
      await instance.stop();
    } catch {
      // Expected if it never fully started, or during fast teardown.
    }
    try {
      await instance.clear();
    } catch {
      // Expected if the container node is already gone.
    }
  };

  const safeStopScanner = async () => {
    // If a start attempt is still in-flight, wait for it to settle
    // before doing anything else — stopping mid-initialization is what
    // causes AbortError on the underlying video element.
    if (startPromiseRef.current) {
      try {
        await startPromiseRef.current;
      } catch {
        // The attempt failed on its own — nothing further to stop.
      }
    }

    const instance = html5QrCodeRef.current;

    if (!instance || scannerPhaseRef.current !== "running") {
      html5QrCodeRef.current = null;
      scannerPhaseRef.current = "idle";
      return;
    }

    scannerPhaseRef.current = "stopping";
    await stopInstance(instance);
    html5QrCodeRef.current = null;
    scannerPhaseRef.current = "idle";
  };

  const handleScanSuccess = async (decodedText) => {
    if (isProcessingRef.current || scannerPhaseRef.current !== "running") return;
    isProcessingRef.current = true;

    await safeStopScanner();

    if (!isMountedRef.current) {
      isProcessingRef.current = false;
      return;
    }

    setScanState("processing");
    setErrorMessage("");

    const gymId = decodedText.trim();

    try {
      const checkIn = await createCheckInRequest(gymId);
      const gym = await fetchGymById(gymId);

      if (!isMountedRef.current) return;
      setCheckedInGym(gym);
      setCheckInTime(checkIn.checkedInAt);
      setScanState("success");
    } catch (err) {
      if (!isMountedRef.current) return;
      setErrorMessage(getErrorMessage(err));
      setScanState("error");
    } finally {
      isProcessingRef.current = false;
    }
  };

  // Builds an ordered list of camera candidates: the likely back/
  // environment camera first, then every other available camera —
  // so a hardware-busy failure on the preferred camera can fall back
  // to a different, usable one instead of just giving up.
  const buildCameraCandidates = (cameras) => {
    const preferredIndex = cameras.findIndex((c) => /back|rear|environment/i.test(c.label));
    if (preferredIndex === -1) return cameras;
    const preferred = cameras[preferredIndex];
    const rest = cameras.filter((_, i) => i !== preferredIndex);
    return [preferred, ...rest];
  };

  const startScanner = async () => {
    if (scannerPhaseRef.current === "starting" || scannerPhaseRef.current === "running") {
      return; // already starting/running — ignore a rapid duplicate click
    }

    generationRef.current += 1;
    const myGeneration = generationRef.current;

    setErrorMessage("");
    setScanState("starting");
    scannerPhaseRef.current = "starting";

    const attempt = (async () => {
      // Ensure any previous instance/stream is fully released first.
      await safeStopScanner();
      if (myGeneration !== generationRef.current || !isMountedRef.current) return;

      // Give the OS a moment to actually free the camera before
      // reopening it — mitigates the NotReadableError race.
      await delay(CAMERA_RELEASE_DELAY_MS);
      if (myGeneration !== generationRef.current || !isMountedRef.current) return;

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {
        throw Object.assign(new Error("No camera found"), { name: "NoCameraError" });
      }

      const candidates = buildCameraCandidates(cameras);
      let lastError = null;

      for (const camera of candidates) {
        if (myGeneration !== generationRef.current || !isMountedRef.current) return;

        const html5QrCode = new Html5Qrcode(SCANNER_ELEMENT_ID);
        html5QrCodeRef.current = html5QrCode;

        try {
          await html5QrCode.start(
            camera.id,
            { fps: 10, qrbox: { width: 240, height: 240 } },
            handleScanSuccess,
            () => {
              // Per-frame "no QR found" callback — expected constantly,
              // not an error.
            }
          );

          if (myGeneration !== generationRef.current || !isMountedRef.current) {
            // Superseded or unmounted right as this camera opened —
            // release it immediately rather than leaving it running.
            await stopInstance(html5QrCode);
            html5QrCodeRef.current = null;
            return;
          }

          scannerPhaseRef.current = "running";
          return; // success — stop trying further candidates
        } catch (err) {
          await stopInstance(html5QrCode);
          html5QrCodeRef.current = null;

          if (isPermissionError(err)) {
            // Permission denial applies regardless of which camera —
            // no point trying the rest of the candidates.
            throw err;
          }

          lastError = err;

          if (!isHardwareBusyError(err)) {
            // An unexpected error type — don't silently keep trying
            // other cameras; surface it.
            throw err;
          }

          // Hardware-busy on this camera — brief pause, then try the
          // next candidate.
          await delay(CAMERA_RELEASE_DELAY_MS);
        }
      }

      // Every candidate failed with a hardware-busy-type error.
      throw lastError || Object.assign(new Error("All cameras unavailable"), { name: "AllCamerasBusyError" });
    })();

    startPromiseRef.current = attempt;

    try {
      await attempt;

      if (myGeneration !== generationRef.current || !isMountedRef.current) return;

      if (scannerPhaseRef.current === "running") {
        setScanState("scanning");
      }
    } catch (err) {
      if (myGeneration !== generationRef.current || !isMountedRef.current) return;

      scannerPhaseRef.current = "idle";
      html5QrCodeRef.current = null;

      if (isPermissionError(err)) {
        setErrorMessage(
          "Camera access was denied. Please allow camera permission in your browser settings and try again."
        );
        setScanState("camera-denied");
      } else if (err?.name === "NotFoundError" || err?.name === "NoCameraError") {
        setErrorMessage("No camera was found on this device.");
        setScanState("error");
      } else if (isHardwareBusyError(err) || err?.name === "AllCamerasBusyError") {
        setErrorMessage(
          "Your camera couldn't be started. It may be in use by another app or browser tab — close it and try again."
        );
        setScanState("error");
      } else {
        console.error("QR scanner start error:", err);
        setErrorMessage("Unable to start the camera. Please try again.");
        setScanState("error");
      }
    } finally {
      startPromiseRef.current = null;
    }
  };

  const handleCancelScan = async () => {
    generationRef.current += 1; // invalidate any in-flight attempt
    await safeStopScanner();
    if (isMountedRef.current) {
      setScanState("idle");
    }
  };

  const handleScanAgain = () => {
    setCheckedInGym(null);
    setCheckInTime(null);
    setErrorMessage("");
    setScanState("idle");
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      generationRef.current += 1; // invalidate any in-flight attempt
      safeStopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background px-6 py-16 sm:py-20">
      <div className="max-w-md mx-auto">
        <Link
          to="/dashboard"
          className="text-xs uppercase tracking-wider text-muted hover:text-white transition-colors duration-200"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-4">
          Scan Gym QR
        </h1>
        <p className="text-muted text-sm mt-2 mb-8">
          Point your camera at the QR code displayed at the gym to check in.
        </p>

        {scanState === "success" ? (
          <div className="border border-green-500/30 bg-green-500/5 p-8 text-center">
            <p className="text-green-400 text-xs font-semibold uppercase tracking-wider">
              Checked In
            </p>
            <p className="text-white text-xl font-semibold tracking-tight mt-2">
              {checkedInGym?.name || "Gym"}
            </p>
            <p className="text-muted text-sm mt-2">
              {new Date(checkInTime).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider rounded-md px-6 py-3 transition-colors duration-200"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={handleScanAgain}
                className="inline-flex items-center justify-center border border-white/20 hover:border-white/40 text-white text-xs font-semibold uppercase tracking-wider rounded-md px-6 py-3 transition-colors duration-200"
              >
                Scan Another
              </button>
            </div>
          </div>
        ) : (
          <>
            {(scanState === "error" || scanState === "camera-denied") && errorMessage && (
              <div className="border border-primary/30 bg-primary/5 text-primary text-sm px-4 py-3 mb-5">
                {errorMessage}
              </div>
            )}

            <div className="relative w-full aspect-square border border-white/10 bg-black/40 overflow-hidden">
              <div id={SCANNER_ELEMENT_ID} ref={scannerContainerRef} className="w-full h-full" />

              {scanState !== "scanning" && (
                <div className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none">
                  {scanState === "idle" && (
                    <p className="text-muted text-sm text-center">Tap below to start scanning</p>
                  )}
                  {scanState === "starting" && (
                    <p className="text-muted text-sm text-center">Starting camera...</p>
                  )}
                  {scanState === "processing" && (
                    <p className="text-muted text-sm text-center">Checking you in...</p>
                  )}
                  {(scanState === "error" || scanState === "camera-denied") && (
                    <p className="text-muted text-sm text-center">Camera is not active</p>
                  )}
                </div>
              )}
            </div>

            {scanState !== "scanning" && scanState !== "starting" && scanState !== "processing" && (
              <button
                onClick={startScanner}
                className="w-full inline-flex items-center justify-center bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider rounded-md px-8 py-4 transition-colors duration-200 mt-6"
              >
                {scanState === "idle" ? "Start Scanning" : "Try Again"}
              </button>
            )}

            {scanState === "scanning" && (
              <button
                onClick={handleCancelScan}
                className="w-full inline-flex items-center justify-center border border-white/20 hover:border-white/40 text-white text-xs font-semibold uppercase tracking-wider rounded-md px-8 py-4 transition-colors duration-200 mt-6"
              >
                Cancel
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ScanGymQR;