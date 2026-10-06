"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";
import { confirmPaymentIntentOrder } from "@/app/actions/orders";
import {
  Lock,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

interface EmbeddedCheckoutFormProps {
  orderId: string;
  amountUSD: number;
  onSuccess: (order: any) => void;
  onBack: () => void;
}

function CheckoutForm({
  orderId,
  amountUSD,
  onSuccess,
  onBack,
}: EmbeddedCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm payment with redirect="if_required" so the buyer stays in-app
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?order_id=${orderId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "An error occurred with your payment.");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Confirm order in DB and decrement inventory
        const res = await confirmPaymentIntentOrder(paymentIntent.id, orderId);
        if (res.success && res.order) {
          onSuccess(res.order);
        } else {
          setErrorMessage(res.error || "Payment succeeded but order confirmation failed.");
          setIsProcessing(false);
        }
      } else {
        // If 3D secure redirected, it will land on return_url
        setIsProcessing(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Test Card Quick Helper */}
      <div className="bg-surface-soft border border-border-light rounded-2xl p-3.5 text-[11px] text-text-secondary flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 font-bold text-ink">
          <CreditCard className="h-4 w-4 text-brand-primary" />
          <span>Stripe Sandbox Test Mode</span>
        </div>
        <p className="text-[10px] text-text-secondary leading-normal">
          Test card: <span className="font-mono font-bold select-all bg-white px-1.5 py-0.5 rounded border border-border-light text-ink">4242 4242 4242 4242</span> • Exp: <span className="font-mono font-semibold text-ink">12/30</span> • CVC: <span className="font-mono font-semibold text-ink">123</span>
        </p>
      </div>

      {/* Embedded Stripe Payment Element */}
      <div className="p-1 min-h-[200px]">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-2.5 pt-3 border-t border-border-light">
        <button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="btn-primary w-full flex items-center justify-center gap-2 font-bold min-h-[50px] shadow-lg shadow-brand-primary/20 rounded-full cursor-pointer active:scale-98 transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying & Charging Card...</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              <span>Confirm & Pay ${amountUSD.toFixed(2)} USD</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="btn-secondary w-full flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-center rounded-full cursor-pointer transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Delivery Details</span>
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-secondary font-medium">
        <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" />
        <span>End-to-end 256-bit encrypted via Stripe Elements</span>
      </div>
    </form>
  );
}

interface EmbeddedStripeCheckoutProps {
  clientSecret: string;
  orderId: string;
  amountUSD: number;
  onSuccess: (order: any) => void;
  onBack: () => void;
}

export default function EmbeddedStripeCheckout({
  clientSecret,
  orderId,
  amountUSD,
  onSuccess,
  onBack,
}: EmbeddedStripeCheckoutProps) {
  const stripePromise = getStripe();

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#0064e0",
            colorBackground: "#ffffff",
            colorText: "#1c2b33",
            colorDanger: "#fa383e",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            borderRadius: "12px",
            fontSizeBase: "14px",
          },
        },
      }}
    >
      <CheckoutForm
        orderId={orderId}
        amountUSD={amountUSD}
        onSuccess={onSuccess}
        onBack={onBack}
      />
    </Elements>
  );
}
