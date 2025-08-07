"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, Calendar, GraduationCap, Award, ArrowRight } from "lucide-react";
import { authClient } from "../lib/auth-client";
import { PageLoader } from "@/components/loader";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface FormData {
  name: string;
  age: string;
  gender: "male" | "female" | "other" | "";
  medicalSchool: string;
  yearOfPassing: string;
  stepExam: "step1" | "step2" | "";
}

interface FormErrors {
  name?: string;
  age?: string;
  gender?: string;
  medicalSchool?: string;
  yearOfPassing?: string;
  stepExam?: string;
}

type FormField = keyof FormData;

const MedicalStudentForm: React.FC = () => {
  const {
    data: session,
    isPending, //loading state
  } = authClient.useSession();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    age: "",
    gender: "",
    medicalSchool: "",
    yearOfPassing: "",
    stepExam: "",
  });
  const router = useRouter();

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleInputChange = (field: FormField, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.age.trim()) {
      newErrors.age = "Age is required";
    } else if (
      isNaN(Number(formData.age)) ||
      parseInt(formData.age) < 18 ||
      parseInt(formData.age) > 100
    ) {
      newErrors.age = "Please enter a valid age between 18-100";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (!formData.medicalSchool.trim()) {
      newErrors.medicalSchool = "Medical school is required";
    }

    if (!formData.yearOfPassing.trim()) {
      newErrors.yearOfPassing = "Year of passing is required";
    } else if (
      isNaN(Number(formData.yearOfPassing)) ||
      parseInt(formData.yearOfPassing) < 1950 ||
      parseInt(formData.yearOfPassing) > new Date().getFullYear() + 10
    ) {
      newErrors.yearOfPassing = "Please enter a valid year";
    }

    if (!formData.stepExam) {
      newErrors.stepExam = "Step exam selection is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const currentYear: number = new Date().getFullYear();
  const years: number[] = Array.from(
    { length: 75 },
    (_, i) => currentYear + 10 - i
  );

  if (isPending) {
    return <PageLoader />;
  }

  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulate API call - replace with your actual API endpoint
      const response = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id: session?.user.id, // Get from auth context or session
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          alert("Please sign up first before completing registration.");
          // Redirect to sign up
        } else if (response.status === 409) {
          alert("Registration already completed. Redirecting to dashboard...");
          // Redirect to dashboard
        } else {
          throw new Error(data.error);
        }
        return;
      }
      toast.success(
        "Registration completed successfully! Redirecting to dashboard..."
      );
      router.push("/dashboard/home");
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
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

      <div className="w-full max-w-2xl relative z-10">
        <Card className="bg-white/80 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center backdrop-blur-sm">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Student Information
            </CardTitle>
            <CardDescription className="text-gray-700 font-medium">
              Please provide your information to access the main application
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 pt-0">
            <div className="space-y-6">
              {/* Name */}
              <div className="space-y-3">
                <Label
                  htmlFor="name"
                  className="text-gray-900 font-semibold flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-4 pr-4 py-4 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500 font-medium bg-white/80 backdrop-blur-sm"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-600 text-sm font-medium">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Age */}
              <div className="space-y-3">
                <Label
                  htmlFor="age"
                  className="text-gray-900 font-semibold flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Age
                </Label>
                <div className="relative">
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter your age"
                    className="pl-4 pr-4 py-4 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500 font-medium bg-white/80 backdrop-blur-sm"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    min={18}
                    max={100}
                  />
                </div>
                {errors.age && (
                  <p className="text-red-600 text-sm font-medium">
                    {errors.age}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-3">
                <Label className="text-gray-900 font-semibold">Gender</Label>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-300 rounded-2xl p-4">
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value: string) =>
                      handleInputChange("gender", value)
                    }
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="male"
                        id="male"
                        className="border-gray-400"
                      />
                      <Label
                        htmlFor="male"
                        className="text-gray-900 font-medium"
                      >
                        Male
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="female"
                        id="female"
                        className="border-gray-400"
                      />
                      <Label
                        htmlFor="female"
                        className="text-gray-900 font-medium"
                      >
                        Female
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="other"
                        id="other"
                        className="border-gray-400"
                      />
                      <Label
                        htmlFor="other"
                        className="text-gray-900 font-medium"
                      >
                        Other
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                {errors.gender && (
                  <p className="text-red-600 text-sm font-medium">
                    {errors.gender}
                  </p>
                )}
              </div>

              {/* Medical School */}
              <div className="space-y-3">
                <Label
                  htmlFor="medicalSchool"
                  className="text-gray-900 font-semibold flex items-center gap-2"
                >
                  <GraduationCap className="h-4 w-4" />
                  Medical School
                </Label>
                <div className="relative">
                  <Input
                    id="medicalSchool"
                    type="text"
                    placeholder="Enter your medical school name"
                    className="pl-4 pr-4 py-4 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500 font-medium bg-white/80 backdrop-blur-sm"
                    value={formData.medicalSchool}
                    onChange={(e) =>
                      handleInputChange("medicalSchool", e.target.value)
                    }
                  />
                </div>
                {errors.medicalSchool && (
                  <p className="text-red-600 text-sm font-medium">
                    {errors.medicalSchool}
                  </p>
                )}
              </div>

              {/* Year of Passing */}
              <div className="space-y-3">
                <Label
                  htmlFor="yearOfPassing"
                  className="text-gray-900 font-semibold"
                >
                  Year of Passing
                </Label>
                <Select
                  value={formData.yearOfPassing}
                  onValueChange={(value: string) =>
                    handleInputChange("yearOfPassing", value)
                  }
                >
                  <SelectTrigger className="py-4 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-gray-900 font-medium">
                    <SelectValue
                      placeholder="Select year of passing"
                      className="text-gray-500"
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl">
                    {years.map((year: number) => (
                      <SelectItem
                        key={year}
                        value={year.toString()}
                        className="text-gray-900 font-medium"
                      >
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.yearOfPassing && (
                  <p className="text-red-600 text-sm font-medium">
                    {errors.yearOfPassing}
                  </p>
                )}
              </div>

              {/* Step Exam */}
              <div className="space-y-3">
                <Label className="text-gray-900 font-semibold flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  USMLE Step Exam
                </Label>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-300 rounded-2xl p-4">
                  <RadioGroup
                    value={formData.stepExam}
                    onValueChange={(value: string) =>
                      handleInputChange("stepExam", value)
                    }
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="step1"
                        id="step1"
                        className="border-gray-400"
                      />
                      <Label
                        htmlFor="step1"
                        className="text-gray-900 font-medium"
                      >
                        Step 1
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="step2"
                        id="step2"
                        className="border-gray-400"
                      />
                      <Label
                        htmlFor="step2"
                        className="text-gray-900 font-medium"
                      >
                        Step 2
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                {errors.stepExam && (
                  <p className="text-red-600 text-sm font-medium">
                    {errors.stepExam}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="group relative overflow-hidden w-full bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="relative flex items-center justify-center">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing Registration...
                    </>
                  ) : (
                    <>
                      Continue to Main App
                      <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/70 font-medium drop-shadow">
            © 2025 Step Genie. All rights reserved.
          </p>
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
};

export default MedicalStudentForm;
