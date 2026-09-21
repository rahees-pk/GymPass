// TEMPORARY CLOUDINARY DIAGNOSTIC SCRIPT
// Run from backend folder:
// node cloudinary-diagnostic.js
//
// Delete this file after the Cloudinary issue is resolved.

import "dotenv/config";
import cloudinary from "./src/config/cloudinary.js";

import https from "node:https";
import crypto from "node:crypto";

// --------------------------------------------------
// Basic environment check
// --------------------------------------------------

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log("========== CLOUDINARY DIAGNOSTIC ==========");

console.log("Cloud name:", cloudName);
console.log("API key loaded:", Boolean(apiKey));
console.log("API secret loaded:", Boolean(apiSecret));

if (!cloudName || !apiKey || !apiSecret) {
  console.error("\n❌ Cloudinary environment variables are missing.");
  process.exit(1);
}

// --------------------------------------------------
// Tiny 1x1 PNG for testing
// --------------------------------------------------

const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const tinyPngBuffer = Buffer.from(TINY_PNG_BASE64, "base64");

// --------------------------------------------------
// TEST 1 — Cloudinary API Ping
// --------------------------------------------------

const testPing = async () => {
  console.log("\n========== TEST 1: CLOUDINARY PING ==========");

  try {
    const result = await cloudinary.api.ping();

    console.log("✅ PING SUCCESS");
    console.log("Cloudinary response:", result);

    return true;
  } catch (error) {
    console.log("❌ PING FAILED");
    console.log("HTTP code:", error?.http_code);
    console.log("Name:", error?.name);
    console.log("Message:", error?.message);

    return false;
  }
};

// --------------------------------------------------
// TEST 2 — Cloudinary SDK upload_stream
// --------------------------------------------------

const testUploadStream = () => {
  console.log("\n========== TEST 2: SDK UPLOAD_STREAM ==========");

  return new Promise((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "gympass/_diagnostic",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.log("❌ UPLOAD FAILED");

          console.log("HTTP code:", error?.http_code);
          console.log("Name:", error?.name);
          console.log("Message:", error?.message);

          try {
            console.log(
              "Full error:",
              JSON.stringify(
                error,
                Object.getOwnPropertyNames(error),
                2
              )
            );
          } catch {
            console.log("Could not stringify error object.");
          }

          resolve(false);
          return;
        }

        console.log("✅ UPLOAD SUCCESS");

        console.log("Secure URL:", result?.secure_url);
        console.log("Public ID:", result?.public_id);

        resolve(true);
      }
    );

    uploadStream.end(tinyPngBuffer);
  });
};

// --------------------------------------------------
// TEST 3 — Raw HTTPS signed upload
// --------------------------------------------------

const testRawSignedUpload = async () => {
  console.log("\n========== TEST 3: RAW HTTPS UPLOAD ==========");

  const timestamp = Math.floor(Date.now() / 1000);

  const folder = "gympass/_diagnostic";

  // Cloudinary signature:
  // sort parameters alphabetically
  // key=value&key=value
  // append API secret
  // SHA-1 hash

  const paramsToSign = {
    folder,
    timestamp,
  };

  const sortedKeys = Object.keys(paramsToSign).sort();

  const stringToSign =
    sortedKeys
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join("&") + apiSecret;

  const signature = crypto
    .createHash("sha1")
    .update(stringToSign)
    .digest("hex");

  console.log("Timestamp:", timestamp);
  console.log("Folder:", folder);
  console.log("Signature generated:", Boolean(signature));

  // ------------------------------------------------
  // Multipart form-data
  // ------------------------------------------------

  const boundary =
    "----GymPassDiagnosticBoundary" + Date.now();

  const fields = {
    api_key: apiKey,
    timestamp: String(timestamp),
    signature,
    folder,
  };

  const parts = [];

  for (const [key, value] of Object.entries(fields)) {
    parts.push(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
        `${value}\r\n`
    );
  }

  parts.push(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="test.png"\r\n` +
      `Content-Type: image/png\r\n\r\n`
  );

  const bodyStart = Buffer.from(parts.join(""), "utf8");

  const bodyEnd = Buffer.from(
    `\r\n--${boundary}--\r\n`,
    "utf8"
  );

  const body = Buffer.concat([
    bodyStart,
    tinyPngBuffer,
    bodyEnd,
  ]);

  // ------------------------------------------------
  // HTTPS request
  // ------------------------------------------------

  const options = {
    hostname: "api.cloudinary.com",

    path: `/v1_1/${cloudName}/image/upload`,

    method: "POST",

    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": body.length,
    },
  };

  return new Promise((resolve) => {
    const request = https.request(
      options,
      (response) => {
        let rawResponse = "";

        response.on("data", (chunk) => {
          rawResponse += chunk.toString();
        });

        response.on("end", () => {
          console.log(
            "\nHTTP status code:",
            response.statusCode
          );

          console.log(
            "X-Cld-Error:",
            response.headers["x-cld-error"] || "(not present)"
          );

          console.log(
            "Content-Type:",
            response.headers["content-type"] || "(not present)"
          );

          console.log(
            "Raw response body:",
            rawResponse
          );

          console.log(
            "==============================================="
          );

          resolve(response.statusCode === 200);
        });
      }
    );

    request.on("error", (error) => {
      console.log(
        "\n❌ Raw HTTPS request failed:"
      );

      console.log("Error:", error.message);

      console.log(
        "==============================================="
      );

      resolve(false);
    });

    request.write(body);
    request.end();
  });
};

// --------------------------------------------------
// RUN ALL TESTS
// --------------------------------------------------

const runDiagnostic = async () => {
  const pingSuccess = await testPing();

  const sdkUploadSuccess = await testUploadStream();

  const rawUploadSuccess = await testRawSignedUpload();

  console.log("\n========== FINAL DIAGNOSIS ==========");

  console.log(
    "Ping:",
    pingSuccess ? "SUCCESS ✅" : "FAILED ❌"
  );

  console.log(
    "SDK upload:",
    sdkUploadSuccess ? "SUCCESS ✅" : "FAILED ❌"
  );

  console.log(
    "Raw upload:",
    rawUploadSuccess ? "SUCCESS ✅" : "FAILED ❌"
  );

  console.log("=====================================");

  console.log(
    "\nDelete this diagnostic file after testing."
  );
};

runDiagnostic();