"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Building,
  FileText,
  MapPin,
  Phone,
  Mail,
  Save,
  Users
} from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

interface BusinessForm {
  name: string;
  type: string;
  gstins: GSTINForm[];
}

interface GSTINForm {
  gstinNumber: string;
  state: string;
  registrationDate: string;
  status: string;
}

export default function NewClientPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    pan: "",
    address: "",
  });

  const [businesses, setBusinesses] = useState<BusinessForm[]>([
    {
      name: "",
      type: "",
      gstins: [{
        gstinNumber: "",
        state: "",
        registrationDate: "",
        status: "Active"
      }]
    }
  ]);

  const businessTypes = [
    "Manufacturing",
    "Services",
    "Trading",
    "Professional",
    "Others"
  ];

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addBusiness = () => {
    setBusinesses(prev => [...prev, {
      name: "",
      type: "",
      gstins: [{
        gstinNumber: "",
        state: "",
        registrationDate: "",
        status: "Active"
      }]
    }]);
  };

  const removeBusiness = (index: number) => {
    if (businesses.length > 1) {
      setBusinesses(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateBusiness = (index: number, field: string, value: string) => {
    setBusinesses(prev => prev.map((business, i) => 
      i === index ? { ...business, [field]: value } : business
    ));
  };

  const addGSTIN = (businessIndex: number) => {
    setBusinesses(prev => prev.map((business, i) => 
      i === businessIndex 
        ? { ...business, gstins: [...business.gstins, {
            gstinNumber: "",
            state: "",
            registrationDate: "",
            status: "Active"
          }] }
        : business
    ));
  };

  const removeGSTIN = (businessIndex: number, gstinIndex: number) => {
    setBusinesses(prev => prev.map((business, i) => 
      i === businessIndex && business.gstins.length > 1
        ? { ...business, gstins: business.gstins.filter((_, j) => j !== gstinIndex) }
        : business
    ));
  };

  const updateGSTIN = (businessIndex: number, gstinIndex: number, field: string, value: string) => {
    setBusinesses(prev => prev.map((business, i) => 
      i === businessIndex
        ? { ...business, gstins: business.gstins.map((gstin, j) => 
            j === gstinIndex ? { ...gstin, [field]: value } : gstin
          )}
        : business
    ));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Client name is required");
      return false;
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      setError("Either email or phone number is required");
      return false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
      setError("Please enter a valid PAN number");
      return false;
    }

    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];
      if (!business.name.trim()) {
        setError(`Business ${i + 1} name is required`);
        return false;
      }

      for (let j = 0; j < business.gstins.length; j++) {
        const gstin = business.gstins[j];
        if (!gstin.gstinNumber.trim()) {
          setError(`GSTIN ${j + 1} for Business ${i + 1} is required`);
          return false;
        }
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/.test(gstin.gstinNumber)) {
          setError(`Please enter a valid GSTIN for Business ${i + 1}, GSTIN ${j + 1}`);
          return false;
        }
      }
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Client created successfully",
        description: `${formData.name} has been added to your client list.`,
      });
      
      router.push("/clients");
    } catch (error) {
      setError("Failed to create client. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Client</h1>
            <p className="mt-2 text-gray-600">Create a new client profile with business and GSTIN details</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Client Information
              </CardTitle>
              <CardDescription>
                Basic details about the client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Client Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter client name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN Number</Label>
                  <Input
                    id="pan"
                    value={formData.pan}
                    onChange={(e) => handleInputChange("pan", e.target.value.toUpperCase())}
                    placeholder="Enter PAN number"
                    maxLength={10}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Businesses and GSTINs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Businesses & GSTINs
                  </CardTitle>
                  <CardDescription>
                    Add business entities and their GST registrations
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addBusiness}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Business
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {businesses.map((business, businessIndex) => (
                <div key={businessIndex} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Business {businessIndex + 1}</h4>
                    {businesses.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBusiness(businessIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Business Name *</Label>
                      <Input
                        value={business.name}
                        onChange={(e) => updateBusiness(businessIndex, "name", e.target.value)}
                        placeholder="Enter business name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Type</Label>
                      <Select value={business.type} onValueChange={(value) => updateBusiness(businessIndex, "type", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">GSTINs</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addGSTIN(businessIndex)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add GSTIN
                      </Button>
                    </div>
                    
                    {business.gstins.map((gstin, gstinIndex) => (
                      <div key={gstinIndex} className="border rounded p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">GSTIN {gstinIndex + 1}</span>
                          {business.gstins.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeGSTIN(businessIndex, gstinIndex)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">GSTIN Number *</Label>
                            <Input
                              value={gstin.gstinNumber}
                              onChange={(e) => updateGSTIN(businessIndex, gstinIndex, "gstinNumber", e.target.value.toUpperCase())}
                              placeholder="Enter GSTIN number"
                              className="text-sm"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">State *</Label>
                            <Select value={gstin.state} onValueChange={(value) => updateGSTIN(businessIndex, gstinIndex, "state", value)}>
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                              <SelectContent>
                                {states.map((state) => (
                                  <SelectItem key={state} value={state}>{state}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Registration Date</Label>
                            <Input
                              type="date"
                              value={gstin.registrationDate}
                              onChange={(e) => updateGSTIN(businessIndex, gstinIndex, "registrationDate", e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Status</Label>
                            <Select value={gstin.status} onValueChange={(value) => updateGSTIN(businessIndex, gstinIndex, "status", value)}>
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                <SelectItem value="Suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/clients">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Client...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Client
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}