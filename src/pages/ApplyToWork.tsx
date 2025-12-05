import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, Upload, CheckCircle, Sparkles, User, Briefcase, Car, Clock, 
  FileText, ArrowRight, ArrowLeft, Phone, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";

const CLEANING_TYPES = [
  { id: "domestic", label: "Domestic Cleaning", icon: "🏠" },
  { id: "deep", label: "Deep Cleaning", icon: "✨" },
  { id: "regular", label: "Regular Cleaning", icon: "🔄" },
  { id: "one-off", label: "One-Off Cleaning", icon: "1️⃣" },
  { id: "end-of-tenancy", label: "End of Tenancy", icon: "🔑" },
  { id: "airbnb", label: "Airbnb / Short-let", icon: "🏨" },
];

const DAYS_OPTIONS = ["1", "2", "3", "4", "5", "6", "7"];
const HOURS_OPTIONS = ["5-10", "10-20", "20-30", "30-40", "40+"];

const STEPS = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Experience", icon: Briefcase },
  { id: 3, title: "Transport", icon: Car },
  { id: 4, title: "Availability", icon: Clock },
  { id: 5, title: "Documents", icon: FileText },
];

const ApplyToWork = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    hasExperience: "",
    experienceDetails: "",
    cleaningTypes: [] as string[],
    hasDrivingLicense: "",
    hasVehicle: "",
    vehicleType: "",
    hoursPerWeek: "",
    daysPerWeek: "",
    additionalInfo: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCleaningTypeChange = (typeId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      cleaningTypes: checked
        ? [...prev.cleaningTypes, typeId]
        : prev.cleaningTypes.filter(t => t !== typeId)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a CV smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setCvFile(file);
    }
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && formData.phone;
      case 2:
        return formData.hasExperience && formData.cleaningTypes.length > 0;
      case 3:
        return formData.hasDrivingLicense && formData.hasVehicle;
      case 4:
        return formData.hoursPerWeek && formData.daysPerWeek;
      case 5:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let cvFilePath = null;

      if (cvFile) {
        const fileExt = cvFile.name.split('.').pop();
        const fileName = `${Date.now()}_${formData.firstName}_${formData.lastName}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('job-applications')
          .upload(fileName, cvFile);

        if (!uploadError) {
          cvFilePath = fileName;
        }
      }

      const { error } = await supabase.functions.invoke('submit-job-application', {
        body: {
          fullName: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          hasExperience: formData.hasExperience === "yes",
          experienceDetails: formData.experienceDetails,
          cleaningTypes: formData.cleaningTypes.map(id => 
            CLEANING_TYPES.find(t => t.id === id)?.label || id
          ),
          hasDrivingLicense: formData.hasDrivingLicense === "yes",
          hasVehicle: formData.hasVehicle === "yes",
          vehicleType: formData.vehicleType,
          availableDays: parseInt(formData.daysPerWeek) || 0,
          availableHours: parseInt(formData.hoursPerWeek.split("-")[0]) || 0,
          cvFilePath,
        }
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "We've received your application and will be in touch soon.",
      });

    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Application Received!</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Thank you for your interest in joining SN Cleaning Services. Our team will review your application and contact you soon.
          </p>
          <Button 
            onClick={() => navigate("/")} 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            We're Hiring!
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Cleaning Team</h1>
          <p className="text-emerald-100 text-lg max-w-xl mx-auto">
            Flexible hours, competitive pay, and a supportive team. Start your journey with SN Cleaning Services today.
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-3xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl shadow-emerald-100/50 p-6">
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div 
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                        isActive && "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200",
                        isCompleted && "bg-emerald-100 text-emerald-600",
                        !isActive && !isCompleted && "bg-gray-100 text-gray-400"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={cn(
                      "text-xs mt-2 font-medium hidden sm:block",
                      isActive && "text-emerald-600",
                      isCompleted && "text-emerald-500",
                      !isActive && !isCompleted && "text-gray-400"
                    )}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-1 mx-2 rounded-full transition-all duration-300",
                      currentStep > step.id ? "bg-emerald-400" : "bg-gray-200"
                    )} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                  <p className="text-gray-500 mt-1">Let's start with your basic details</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="John"
                      className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Smith"
                      className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="john@example.com"
                      className="h-12 pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="07123 456789"
                      className="h-12 pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Experience */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Cleaning Experience</h2>
                  <p className="text-gray-500 mt-1">Tell us about your background</p>
                </div>

                <div className="space-y-4">
                  <Label className="text-gray-700">Do you have cleaning experience?</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleInputChange("hasExperience", "yes")}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                        formData.hasExperience === "yes"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className="text-2xl mb-2 block">✅</span>
                      <span className="font-medium">Yes, I have experience</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange("hasExperience", "no")}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                        formData.hasExperience === "no"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className="text-2xl mb-2 block">🌱</span>
                      <span className="font-medium">No, but eager to learn</span>
                    </button>
                  </div>
                </div>

                {formData.hasExperience === "yes" && (
                  <div className="space-y-2">
                    <Label htmlFor="experienceDetails" className="text-gray-700">
                      Tell us about your experience
                    </Label>
                    <Textarea
                      id="experienceDetails"
                      value={formData.experienceDetails}
                      onChange={(e) => handleInputChange("experienceDetails", e.target.value)}
                      placeholder="e.g., 2 years at ABC Cleaning, residential and commercial cleaning..."
                      rows={4}
                      className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <Label className="text-gray-700">What types of cleaning are you happy to do?</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CLEANING_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleCleaningTypeChange(type.id, !formData.cleaningTypes.includes(type.id))}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                          formData.cleaningTypes.includes(type.id)
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <span className="text-xl mb-1 block">{type.icon}</span>
                        <span className={cn(
                          "text-sm font-medium",
                          formData.cleaningTypes.includes(type.id) ? "text-emerald-700" : "text-gray-600"
                        )}>
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Transport */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Transport</h2>
                  <p className="text-gray-500 mt-1">Information about getting to jobs</p>
                </div>

                <div className="space-y-4">
                  <Label className="text-gray-700">Do you have a driving license?</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleInputChange("hasDrivingLicense", "yes")}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-200 text-center",
                        formData.hasDrivingLicense === "yes"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className="text-2xl mb-2 block">🪪</span>
                      <span className="font-medium">Yes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange("hasDrivingLicense", "no")}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-200 text-center",
                        formData.hasDrivingLicense === "no"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className="text-2xl mb-2 block">🚶</span>
                      <span className="font-medium">No</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-gray-700">Do you have a vehicle for work?</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleInputChange("hasVehicle", "yes")}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-200 text-center",
                        formData.hasVehicle === "yes"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className="text-2xl mb-2 block">🚗</span>
                      <span className="font-medium">Yes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange("hasVehicle", "no")}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-200 text-center",
                        formData.hasVehicle === "no"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className="text-2xl mb-2 block">🚌</span>
                      <span className="font-medium">No</span>
                    </button>
                  </div>
                </div>

                {formData.hasVehicle === "yes" && (
                  <div className="space-y-4">
                    <Label className="text-gray-700">What type of vehicle?</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: "car", label: "Car", icon: "🚗" },
                        { value: "van", label: "Van", icon: "🚐" },
                        { value: "both", label: "Both", icon: "🚗🚐" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleInputChange("vehicleType", option.value)}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all duration-200 text-center",
                            formData.vehicleType === option.value
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <span className="text-xl mb-1 block">{option.icon}</span>
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Availability */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Availability</h2>
                  <p className="text-gray-500 mt-1">How much time can you commit?</p>
                </div>

                <div className="space-y-4">
                  <Label className="text-gray-700">Hours per week</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {HOURS_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleInputChange("hoursPerWeek", option)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all duration-200 text-center",
                          formData.hoursPerWeek === option
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <span className="text-lg font-bold block">{option}</span>
                        <span className="text-xs text-gray-500">hours</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-gray-700">Days per week</Label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                    {DAYS_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleInputChange("daysPerWeek", option)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all duration-200 text-center",
                          formData.daysPerWeek === option
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <span className="text-lg font-bold">{option}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Documents */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Final Step</h2>
                  <p className="text-gray-500 mt-1">Upload your CV and submit</p>
                </div>

                <div className="space-y-4">
                  <Label className="text-gray-700">Upload your CV (optional)</Label>
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer",
                      cvFile 
                        ? "border-emerald-400 bg-emerald-50" 
                        : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                    )}
                    onClick={() => document.getElementById('cv-upload')?.click()}
                  >
                    <input
                      type="file"
                      id="cv-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                    {cvFile ? (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                          <CheckCircle className="w-8 h-8 text-emerald-600" />
                        </div>
                        <p className="font-medium text-emerald-700">{cvFile.name}</p>
                        <p className="text-sm text-gray-500 mt-1">Click to change</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="font-medium text-gray-700">Click to upload your CV</p>
                        <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX (max 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo" className="text-gray-700">
                    Anything else you'd like us to know?
                  </Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                    placeholder="Tell us anything else that might be relevant..."
                    rows={4}
                    className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                  <h3 className="font-semibold text-gray-900">Application Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 font-medium">{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 font-medium">{formData.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Experience:</span>
                      <span className="ml-2 font-medium">{formData.hasExperience === "yes" ? "Yes" : "No"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Availability:</span>
                      <span className="ml-2 font-medium">{formData.daysPerWeek} days, {formData.hoursPerWeek}h/week</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              
              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-8"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Footer spacer */}
      <div className="h-16" />
    </div>
  );
};

export default ApplyToWork;
