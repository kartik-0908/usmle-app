"use client";
import React, { useState } from "react";
import {
  Mail,
  Send,
  MessageCircle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "../lib/auth-client";
import Image from "next/image";

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
        callbackURL: "/dashboard/home",
        newUserCallbackURL: "/profile",
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

  const handleWhatsAppJoin = () => {
    // Replace with your actual WhatsApp group link
    const whatsappGroupLink =
      "https://chat.whatsapp.com/KQLaXNhJKEu2w0KqtEP5Cs";
    window.open(whatsappGroupLink, "_blank");
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url("/Header-background.webp")',
        backgroundPosition: "center 30%",
      }}
    >
      {/* Medical theme background elements */}
      <div className="absolute -top-[10%] -right-[5%] w-1/2 h-[70%] bg-gradient-to-br from-blue-500/20 to-green-500/20 opacity-30 blur-3xl rounded-full"></div>

      {/* Subtle animated elements matching USMLE theme */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100/15 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-green-200/15 rounded-full blur-lg animate-bounce"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-blue-200/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-1/2 right-1/3 w-28 h-28 bg-green-100/15 rounded-full blur-xl animate-float"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 mx-auto">
          <Image
            className="w-full max-w-sm"
            src={"/logo-new.png"}
            alt="Step Genie Logo"
            width={200}
            height={64}
          ></Image>
        </div>

        <Card className="bg-white/80 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center backdrop-blur-sm">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {emailSent ? "Check Your Email" : ""}
            </CardTitle>
            <CardDescription className="text-gray-700 font-medium">
              {emailSent
                ? "We've sent you a magic link to sign in securely"
                : "Sign in to continue your USMLE preparation"}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 pt-0">
            {emailSent ? (
              // Email Sent State
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="bg-gradient-to-br from-green-100/80 to-green-200/80 backdrop-blur-sm border border-green-200 p-6 rounded-full">
                    <Send className="h-10 w-10 text-green-600" />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-gray-700 font-medium">
                    We've sent a magic link to:
                  </p>
                  <p className="font-bold text-gray-900 text-lg">
                    {signInData.email}
                  </p>
                  <p className="text-gray-700">
                    Click the link in your email to sign in securely.
                  </p>
                </div>

                {/* WhatsApp Group Invitation */}
                <div className="bg-white/80 backdrop-blur-xl border border-green-200 rounded-2xl p-6 space-y-4 shadow-lg">
                  <div className="flex items-center justify-center">
                    <div className="bg-green-500 rounded-full p-2 mr-3">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-green-800 text-lg">
                      Join Our Community
                    </h3>
                  </div>
                  <p className="text-green-700 font-medium">
                    While you wait, join our WhatsApp group to connect with
                    fellow medical students and get study tips!
                  </p>
                  <button
                    onClick={handleWhatsAppJoin}
                    className="group relative overflow-hidden w-full bg-green-500 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:bg-green-600"
                    style={{
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <div className="relative flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Join WhatsApp Group
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </div>
                  </button>
                </div>

                <div className="pt-4 space-y-2">
                  <p className="text-gray-600">
                    Didn't receive the email? Check your spam folder or
                  </p>
                  <button
                    onClick={resetToForm}
                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-300"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : (
              // Sign In Form
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="email"
                    className="text-gray-900 font-semibold"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <Mail className="h-5 w-5 text-black" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-12 pr-4 py-4 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500 font-medium bg-white/80 backdrop-blur-sm"
                      value={signInData.email}
                      onChange={(e) =>
                        setSignInData({ ...signInData, email: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-600 text-sm font-medium">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="text-center bg-blue-50/50 backdrop-blur-sm rounded-2xl p-4">
                  <p className="text-gray-700 font-medium">
                    We'll send you a secure magic link to sign in instantly
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={loading}
                  className="group relative overflow-hidden w-full bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <div className="relative flex items-center justify-center">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending Magic Link...
                      </>
                    ) : (
                      <>
                        Send Magic Link
                        <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <div>
            <p className="text-gray-400 font-medium">
              © 2025 StepGenie. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
