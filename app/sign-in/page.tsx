"use client";
import React, { useState } from "react";
import { Mail, BookOpen, Send } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authClient } from "../lib/auth-client";

// Types
interface SignInFormData {
  email: string;
}

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Sign In Form State
  const [signInData, setSignInData] = useState<SignInFormData>({
    email: "",
  });

  // Form Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateSignIn = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!signInData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signInData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateSignIn()) return;

    setLoading(true);

    try {
      // Replace with your actual magic link API call
      const { data, error } = await authClient.signIn.magicLink({
        email: signInData.email,
        callbackURL: "/dashboard/home", //redirect after successful login (optional)
      });
      console.log("Magic link sent:", data);
      if (error) {
        console.error("Error sending magic link:", error);
        setErrors({ email: "Failed to send magic link. Please try again." });
        return;
      }
      setEmailSent(true);
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetToForm = () => {
    setEmailSent(false);
    setErrors({});
    setSignInData({ email: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">StepGenie</h1>
          <p className="text-gray-600 mt-2">Your path to medical excellence</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {emailSent ? "Check Your Email" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {emailSent
                ? "We've sent you a magic link to sign in securely"
                : "Sign in to continue your preparation"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {emailSent ? (
              // Email Sent State
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="bg-green-100 p-4 rounded-full">
                    <Send className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    We've sent a magic link to:
                  </p>
                  <p className="font-semibold text-gray-900">
                    {signInData.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    Click the link in your email to sign in securely.
                  </p>
                </div>
                <div className="pt-4 space-y-2">
                  <p className="text-xs text-gray-500">
                    Didn't receive the email? Check your spam folder or
                  </p>
                  <Button
                    variant="link"
                    onClick={resetToForm}
                    className="text-sm"
                  >
                    Try again
                  </Button>
                </div>
              </div>
            ) : (
              // Sign In Form
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={signInData.email}
                      onChange={(e) =>
                        setSignInData({ ...signInData, email: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    We'll send you a secure magic link to sign in instantly
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleSignIn}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? "Sending Magic Link..." : "Send Magic Link"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2025 StepGenie. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}