import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, CheckCircle, Sparkles } from "lucide-react";

const CLEANING_TYPES = [
  { id: "domestic", label: "Domestic Cleaning" },
  { id: "deep", label: "Deep Cleaning" },
  { id: "regular", label: "Regular Cleaning" },
  { id: "one-off", label: "One-Off Cleaning" },
  { id: "end-of-tenancy", label: "End of Tenancy" },
  { id: "airbnb", label: "Airbnb / Short-let Turnovers" },
];

const DAYS_OPTIONS = ["1", "2", "3", "4", "5", "6", "7"];
const HOURS_OPTIONS = ["5-10", "10-20", "20-30", "30-40", "40+"];

const ApplyToWork = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.cleaningTypes.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one type of cleaning you're happy to do",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let cvUrl = null;

      // Upload CV if provided
      if (cvFile) {
        const fileExt = cvFile.name.split('.').pop();
        const fileName = `${Date.now()}_${formData.firstName}_${formData.lastName}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('job-applications')
          .upload(fileName, cvFile);

        if (uploadError) {
          console.error("CV upload error:", uploadError);
          // Continue without CV if upload fails
        } else {
          const { data: urlData } = supabase.storage
            .from('job-applications')
            .getPublicUrl(fileName);
          cvUrl = urlData.publicUrl;
        }
      }

      // Submit application via edge function
      const { data, error } = await supabase.functions.invoke('submit-job-application', {
        body: {
          ...formData,
          cvUrl,
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Received!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for your interest in joining our team. We've received your application and our staff will review it carefully. We'll contact you as soon as we have an opening that matches your profile.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Join Our Team
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Apply to Work With Us</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We're always looking for reliable, hardworking cleaners to join our team. Fill out the form below and we'll be in touch.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Smith"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="07123 456789"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Cleaning Experience</CardTitle>
              <CardDescription>Tell us about your cleaning experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Do you have any cleaning experience? *</Label>
                <RadioGroup
                  value={formData.hasExperience}
                  onValueChange={(value) => handleInputChange("hasExperience", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="exp-yes" />
                    <Label htmlFor="exp-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="exp-no" />
                    <Label htmlFor="exp-no" className="font-normal">No, but I'm eager to learn</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.hasExperience === "yes" && (
                <div className="space-y-2">
                  <Label htmlFor="experienceDetails">
                    Please tell us about your experience (where, how long, what type of cleaning)
                  </Label>
                  <Textarea
                    id="experienceDetails"
                    value={formData.experienceDetails}
                    onChange={(e) => handleInputChange("experienceDetails", e.target.value)}
                    placeholder="e.g., 2 years at ABC Cleaning Company, residential cleaning including deep cleans and regular maintenance..."
                    rows={4}
                  />
                </div>
              )}

              <div className="space-y-3">
                <Label>What types of cleaning are you happy to do? *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CLEANING_TYPES.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.id}
                        checked={formData.cleaningTypes.includes(type.id)}
                        onCheckedChange={(checked) => 
                          handleCleaningTypeChange(type.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={type.id} className="font-normal">{type.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transport */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Transport</CardTitle>
              <CardDescription>Information about your transport options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Do you have a driving license? *</Label>
                <RadioGroup
                  value={formData.hasDrivingLicense}
                  onValueChange={(value) => handleInputChange("hasDrivingLicense", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="license-yes" />
                    <Label htmlFor="license-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="license-no" />
                    <Label htmlFor="license-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Do you have a car or van that can be used for work? *</Label>
                <RadioGroup
                  value={formData.hasVehicle}
                  onValueChange={(value) => handleInputChange("hasVehicle", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="vehicle-yes" />
                    <Label htmlFor="vehicle-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="vehicle-no" />
                    <Label htmlFor="vehicle-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.hasVehicle === "yes" && (
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">What type of vehicle?</Label>
                  <Select
                    value={formData.vehicleType}
                    onValueChange={(value) => handleInputChange("vehicleType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Availability */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Availability</CardTitle>
              <CardDescription>How much time can you commit?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>How many hours per week are you looking to work? *</Label>
                  <Select
                    value={formData.hoursPerWeek}
                    onValueChange={(value) => handleInputChange("hoursPerWeek", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hours" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option} hours
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>How many days per week can you work? *</Label>
                  <Select
                    value={formData.daysPerWeek}
                    onValueChange={(value) => handleInputChange("daysPerWeek", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select days" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option} {option === "1" ? "day" : "days"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CV Upload & Additional Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Upload your CV and add any other details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Upload your CV (optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="cv-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="cv-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    {cvFile ? (
                      <p className="text-sm font-medium text-primary">{cvFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium">Click to upload your CV</p>
                        <p className="text-xs text-muted-foreground">PDF, DOC, DOCX (max 5MB)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Anything else you'd like us to know?</Label>
                <Textarea
                  id="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                  placeholder="Any other information you think would be helpful..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 text-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting Application...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            By submitting this application, you agree to be contacted regarding job opportunities.
          </p>
        </form>
      </div>
    </div>
  );
};

export default ApplyToWork;
