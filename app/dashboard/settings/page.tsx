"use client";

import React from "react";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { paymentAPI, subscriptionAPI, userAPI } from "@/lib/api";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type SubscriptionPlan = {
  _id: string;
  planName: string;
  pricePerMonth: number;
  pricePerYear: number;
  description?: string;
  features?: string[];
  isActive?: boolean;
};

type BillingPeriod = "monthly" | "yearly";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

function PaymentForm({
  plan,
  billingPeriod,
  userId,
  onClose,
}: {
  plan: SubscriptionPlan;
  billingPeriod: BillingPeriod;
  userId: string;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe is not ready. Please try again.");
      return;
    }

    const card = elements.getElement(CardElement);
    if (!card) {
      toast.error("Please enter your card details.");
      return;
    }

    const price =
      billingPeriod === "yearly" ? plan.pricePerYear : plan.pricePerMonth;
    if (!price || price <= 0) {
      toast.error("Invalid plan price.");
      return;
    }

    setIsPaying(true);
    try {
      const createRes = await paymentAPI.createPayment({
        userId,
        price,
        subscriptionId: plan._id,
        type: "subscription",
        billingPeriod,
      });

      const clientSecret = createRes.data.clientSecret;
      const fallbackIntentId = createRes.data.paymentIntentId;

      const confirmResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (confirmResult.error) {
        throw new Error(confirmResult.error.message || "Payment failed");
      }

      const paymentIntentId =
        confirmResult.paymentIntent?.id || fallbackIntentId;
      if (paymentIntentId) {
        await paymentAPI.confirmPayment(paymentIntentId);
      }

      toast.success("Payment completed successfully");
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.error || error?.message || "Payment failed";
      toast.error(message);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Plan</p>
        <p className="text-slate-700">{plan.planName}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Billing</p>
        <p className="text-slate-700">
          {billingPeriod === "yearly" ? "Yearly" : "Monthly"} - $
          {billingPeriod === "yearly" ? plan.pricePerYear : plan.pricePerMonth}
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Card Details</Label>
        <div className="rounded-md border border-amber-300 p-3">
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: "14px",
                  color: "#1f2937",
                  "::placeholder": { color: "#9ca3af" },
                },
              },
            }}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPaying}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-amber-600 hover:bg-amber-700 text-white"
          disabled={isPaying}
        >
          {isPaying ? "Processing..." : "Pay Now"}
        </Button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  const { data: profileData } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => userAPI.getProfile(),
    select: (response) => response.data.data,
  });

  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery(
    {
      queryKey: ["subscriptions"],
      queryFn: () => subscriptionAPI.getSubscriptions(),
      select: (response) => response.data.data,
    },
  );

  const subscriptions = useMemo(() => {
    const items = Array.isArray(subscriptionsData) ? subscriptionsData : [];
    return items.filter((plan: SubscriptionPlan) => plan.isActive !== false);
  }, [subscriptionsData]);

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      userAPI.changePassword(currentPassword, newPassword, confirmPassword),
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setChangePasswordOpen(false);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to change password";
      toast.error(message);
    },
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    changePasswordMutation.mutate();
  };

  const openPayment = (plan: SubscriptionPlan) => {
    if (!profileData?._id) {
      toast.error("User profile not loaded. Please try again.");
      return;
    }
    if (!stripePromise) {
      toast.error(
        "Stripe key is missing. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
      );
      return;
    }
    setSelectedPlan(plan);
    setBillingPeriod("monthly");
  };

  const closePayment = () => {
    setSelectedPlan(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-slate-500 mt-1">Dashboard &gt; Settings</p>
        </div>
        <div>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => setChangePasswordOpen(true)}
          >
            Change Password
          </Button>
        </div>
      </div>

      {/* Change Password Modal */}
      <Dialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Update your account password</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="current" className="text-sm font-medium">
                Current Password
              </Label>
              <Input
                id="current"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2 border-2 border-amber-300"
                disabled={changePasswordMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="new" className="text-sm font-medium">
                New Password
              </Label>
              <Input
                id="new"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2 border-2 border-amber-300"
                disabled={changePasswordMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="confirm" className="text-sm font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 border-2 border-amber-300"
                disabled={changePasswordMutation.isPending}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setChangePasswordOpen(false)}
                disabled={changePasswordMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {changePasswordMutation.isPending
                  ? "Updating..."
                  : "Update Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subscription Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Select a plan and pay with Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : subscriptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptions.map((plan: SubscriptionPlan) => (
                <div
                  key={plan._id}
                  className="rounded-lg border border-amber-200 p-4 space-y-3"
                >
                  <div>
                    <p className="text-lg font-semibold">{plan.planName}</p>
                    <p className="text-sm text-slate-500">
                      {plan.description || "No description"}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-amber-700">
                      ${plan.pricePerMonth}
                    </span>
                    <span className="text-sm text-slate-500">/ month</span>
                  </div>
                  <p className="text-sm text-slate-500">
                    ${plan.pricePerYear} / year
                  </p>
                  {plan.features && plan.features.length > 0 && (
                    <ul className="text-sm text-slate-600 list-disc pl-5">
                      {plan.features.map((feature, index) => (
                        <li key={`${plan._id}-feature-${index}`}>{feature}</li>
                      ))}
                    </ul>
                  )}
                  <Button
                    onClick={() => openPayment(plan)}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Upgrade Plan
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No subscription plans available.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={closePayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>Pay securely using Stripe</DialogDescription>
          </DialogHeader>
          {selectedPlan ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={billingPeriod === "monthly" ? "default" : "outline"}
                  className={
                    billingPeriod === "monthly"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : ""
                  }
                  onClick={() => setBillingPeriod("monthly")}
                >
                  Monthly
                </Button>
                <Button
                  type="button"
                  variant={billingPeriod === "yearly" ? "default" : "outline"}
                  className={
                    billingPeriod === "yearly"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : ""
                  }
                  onClick={() => setBillingPeriod("yearly")}
                >
                  Yearly
                </Button>
              </div>
              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    plan={selectedPlan}
                    billingPeriod={billingPeriod}
                    userId={profileData?._id || ""}
                    onClose={closePayment}
                  />
                </Elements>
              ) : (
                <div className="text-sm text-slate-600">
                  Stripe key missing. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to
                  enable payments.
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
