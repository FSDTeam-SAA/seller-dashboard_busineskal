'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';

export default function EnterOTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    const storedEmail = localStorage.getItem('resetEmail');
    if (!storedEmail) {
      router.push('/auth/forgot-password');
      return;
    }
    setEmail(storedEmail);
    setResendTimer(60);
    setCanResend(false);
  }, [router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const resendOTPMutation = useMutation({
    mutationFn: () => authAPI.forgotPassword(email),
    onSuccess: () => {
      toast.success('OTP resent to your email');
      setCanResend(false);
      setResendTimer(60);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    localStorage.setItem('resetOTP', otp);
    router.push('/auth/reset-password');
  };

  const handleResend = () => {
    resendOTPMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center">Enter OTP</CardTitle>
          <CardDescription className="text-center text-base">
            We've sent a 6-digit code to your email. Please enter it below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                disabled={resendOTPMutation.isPending}
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot
                    index={0}
                    className="border-2 border-amber-300 h-12 w-12 text-lg rounded-lg"
                  />
                  <InputOTPSlot
                    index={1}
                    className="border-2 border-amber-300 h-12 w-12 text-lg rounded-lg"
                  />
                  <InputOTPSlot
                    index={2}
                    className="border-2 border-amber-300 h-12 w-12 text-lg rounded-lg"
                  />
                  <InputOTPSlot
                    index={3}
                    className="border-2 border-amber-300 h-12 w-12 text-lg rounded-lg"
                  />
                  <InputOTPSlot
                    index={4}
                    className="border-2 border-amber-300 h-12 w-12 text-lg rounded-lg"
                  />
                  <InputOTPSlot
                    index={5}
                    className="border-2 border-amber-300 h-12 w-12 text-lg rounded-lg"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="text-center text-sm">
              <span className="text-slate-600">Didn't Receive OTP?</span>{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || resendOTPMutation.isPending}
                className="font-medium text-amber-600 hover:text-amber-700 disabled:text-slate-400"
              >
                {resendOTPMutation.isPending
                  ? 'Resending...'
                  : canResend
                    ? 'RESEND OTP'
                    : `Resend in ${resendTimer}s`}
              </button>
            </div>

            <Button
              type="submit"
              disabled={otp.length !== 6}
              className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg"
            >
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
