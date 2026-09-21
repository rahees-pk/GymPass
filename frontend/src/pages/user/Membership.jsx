import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createOrderRequest, verifyPaymentRequest } from "../../api/payments";
import { getErrorMessage } from "../../utils/errorMessage";

const PLANS = [
  { id: "monthly", label: "Monthly", price: 999, duration: "30 days" },
  { id: "quarterly", label: "Quarterly", price: 2499, duration: "90 days" },
  { id: "annual", label: "Annual", price: 7999, duration: "365 days" },
];

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Loads the Razorpay Checkout script once, reusing it on subsequent
// calls rather than injecting a duplicate <script> tag every time the
// user clicks "Pay Now" more than once in a session.
let razorpayScriptPromise = null;
const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = RAZORPAY_SCRIPT_SRC;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
};

// "idle" | "creatingOrder" | "verifying" | "success" | "error" | "cancelled"
const Membership = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [flowState, setFlowState] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activatedMembership, setActivatedMembership] = useState(null);

  const isBusy = flowState === "creatingOrder" || flowState === "verifying";

  const handleChoosePlan = (planId) => {
    if (isBusy) return;
    setSelectedPlan(planId);
    setFlowState("idle");
    setErrorMessage("");
  };

  const handlePayNow = async () => {
    if (!selectedPlan || isBusy) return;

    if (!user) {
      setErrorMessage("Please log in to purchase a membership.");
      setFlowState("error");
      return;
    }

    setErrorMessage("");
    setFlowState("creatingOrder");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMessage("Unable to load the payment window. Please check your connection and try again.");
        setFlowState("error");
        return;
      }

      const orderData = await createOrderRequest(selectedPlan);

      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKeyId) {
        console.error("VITE_RAZORPAY_KEY_ID is not set in the frontend environment.");
        setErrorMessage("Payment is not configured correctly. Please contact support.");
        setFlowState("error");
        return;
      }

      const options = {
        key: razorpayKeyId, // public key id only — the secret never touches the frontend
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        order_id: orderData.order.id,
        name: "GymPass",
        description: `${PLANS.find((p) => p.id === selectedPlan)?.label} Membership`,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#FF3B30",
        },
        handler: async (response) => {
          setFlowState("verifying");
          try {
            const verifyData = await verifyPaymentRequest({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setActivatedMembership(verifyData.membership);
            setFlowState("success");
          } catch (err) {
            setErrorMessage(getErrorMessage(err));
            setFlowState("error");
          }
        },
        modal: {
          ondismiss: () => {
            // User closed the checkout window without completing
            // payment — a distinct, non-alarming state, not an error.
            setFlowState((current) => (current === "creatingOrder" ? "cancelled" : current));
          },
        },
      };

      const razorpayCheckout = new window.Razorpay(options);

      razorpayCheckout.on("payment.failed", () => {
        setErrorMessage("Your payment could not be completed. Please try again.");
        setFlowState("error");
      });

      setFlowState("idle");
      razorpayCheckout.open();
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
      setFlowState("error");
    }
  };

  if (flowState === "success" && activatedMembership) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-24">
        <div className="max-w-md w-full border border-white/10 p-10 text-center">
          <span className="w-1 h-4 bg-primary inline-block mb-5" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Membership Activated
          </h1>
          <p className="text-muted text-sm mt-4 leading-relaxed">
            Your payment was successful and your GymPass membership is now active — giving you
            access to every approved partner gym.
          </p>
          <div className="border-t border-white/10 mt-8 pt-6 text-left space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted">Plan</p>
            <p className="text-white text-sm capitalize">{activatedMembership.plan}</p>
            <p className="text-xs uppercase tracking-wider text-muted mt-3">Valid Until</p>
            <p className="text-white text-sm">
              {new Date(activatedMembership.endDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <Link
            to="/gyms"
            className="inline-flex items-center justify-center bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider rounded-md px-8 py-3.5 transition-colors duration-200 mt-8"
          >
            Explore Gyms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            GymPass Membership
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mt-3">
            One Membership. Every Gym.
          </h1>
          <p className="text-muted text-sm sm:text-base mt-4 leading-relaxed">
            Choose a plan and get access to every approved partner gym on GymPass — no
            separate memberships, no extra sign-ups.
          </p>

          {!user && (
            <p className="text-muted text-xs mt-6">
              <Link to="/login" className="text-primary hover:text-secondary transition-colors duration-200">
                Log in
              </Link>{" "}
              or{" "}
              <Link to="/register" className="text-primary hover:text-secondary transition-colors duration-200">
                create an account
              </Link>{" "}
              to purchase a membership.
            </p>
          )}
        </div>
      </section>

      {/* Plans */}
      <section className="px-6 pb-20 sm:pb-28 border-t border-white/10 pt-16 sm:pt-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`flex flex-col border p-8 transition-colors duration-200 ${
                    isSelected ? "border-primary" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {plan.label}
                  </span>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold tracking-tight text-white">
                      ₹{plan.price}
                    </span>
                  </div>

                  <p className="text-muted text-sm mt-2">{plan.duration} of full access</p>

                  <div className="mt-8 pt-8 border-t border-white/10 flex-1 flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => handleChoosePlan(plan.id)}
                      disabled={isBusy}
                      className={`w-full text-xs font-semibold uppercase tracking-wider rounded-md px-6 py-3.5 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                        isSelected
                          ? "bg-primary text-white"
                          : "border border-white/20 text-white hover:border-white/40"
                      }`}
                    >
                      {isSelected ? "Plan Selected" : "Choose Plan"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkout panel — appears once a plan is selected */}
          {selectedPlan && (
            <div className="max-w-md mx-auto mt-12 border border-white/10 p-8 text-center">
              <p className="text-muted text-xs uppercase tracking-wider">
                Selected Plan
              </p>
              <p className="text-white text-lg font-semibold tracking-tight mt-1">
                {PLANS.find((p) => p.id === selectedPlan)?.label} — ₹
                {PLANS.find((p) => p.id === selectedPlan)?.price}
              </p>

              {flowState === "error" && errorMessage && (
                <div className="border border-primary/30 bg-primary/5 text-primary text-sm px-4 py-3 mt-5 text-left">
                  {errorMessage}
                </div>
              )}

              {flowState === "cancelled" && (
                <div className="border border-white/15 text-muted text-sm px-4 py-3 mt-5 text-left">
                  Payment was cancelled. You can try again whenever you're ready.
                </div>
              )}

              <button
                type="button"
                onClick={handlePayNow}
                disabled={isBusy || !user}
                className="w-full bg-primary hover:bg-secondary disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold uppercase tracking-wider rounded-md px-6 py-3.5 transition-colors duration-200 mt-6"
              >
                {flowState === "creatingOrder"
                  ? "Preparing Checkout..."
                  : flowState === "verifying"
                  ? "Verifying Payment..."
                  : "Pay Now"}
              </button>

              {!user && (
                <p className="text-muted text-xs mt-4">
                  You need to be logged in to complete this purchase.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Membership;