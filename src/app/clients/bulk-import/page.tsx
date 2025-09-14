"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Save,
  Users,
  FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

interface ImportData {
  clientName: string;
  email?: string;
  phone?: string;
  pan?: string;
  address?: string;
  businessName: string;
  businessType?: string;
  gstinNumber: string;
  state: string;
  registrationDate?: string;
  status: string;
}

interface ValidationResult {
  row: number;
  data: ImportData;
  errors: string[];
  warnings: string[];
}

export default function BulkImportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportData[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<"upload" | "validate" | "review" | "import">("upload");
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: { row: number; error: string }[];
  }>({ success: 0, failed: 0, errors: [] });

  const sampleCSVData = `clientName,email,phone,pan,address,businessName,businessType,gstinNumber,state,registrationDate,status
ABC Enterprises,contact@abc.com,+91 9876543210,ABCDE1234F,Mumbai,Maharashtra,ABC Manufacturing,Manufacturing,27ABCDE1234F1Z5,Maharashtra,2020-01-15,Active
XYZ Solutions,info@xyz.com,+91 8765432109,FGHIJ5678G,Bangalore,Karnataka,XYZ Tech Services,Services,29FGHIJ5678G1Z5,Karnataka,2021-03-20,Active
PQR Traders,pqr@traders.com,+91 7654321098,KLMNO9012H,Delhi,Delhi,PQR Trading Co,Trading,07KLMNO9012H1Z5,Delhi,2019-07-10,Active`;

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const parseCSV = (csvText: string): ImportData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const data: ImportData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const rowData: any = {};
      
      headers.forEach((header, index) => {
        rowData[header] = values[index] || '';
      });

      data.push({
        clientName: rowData.clientName || '',
        email: rowData.email || '',
        phone: rowData.phone || '',
        pan: rowData.pan || '',
        address: rowData.address || '',
        businessName: rowData.businessName || '',
        businessType: rowData.businessType || '',
        gstinNumber: rowData.gstinNumber || '',
        state: rowData.state || '',
        registrationDate: rowData.registrationDate || '',
        status: rowData.status || 'Active'
      });
    }

    return data;
  };

  const validateData = (data: ImportData[]): ValidationResult[] => {
    return data.map((row, index) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Required fields validation
      if (!row.clientName.trim()) {
        errors.push("Client name is required");
      }
      if (!row.businessName.trim()) {
        errors.push("Business name is required");
      }
      if (!row.gstinNumber.trim()) {
        errors.push("GSTIN number is required");
      }

      // Email validation
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push("Invalid email format");
      }

      // PAN validation
      if (row.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(row.pan)) {
        errors.push("Invalid PAN format");
      }

      // GSTIN validation
      if (row.gstinNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/.test(row.gstinNumber)) {
        errors.push("Invalid GSTIN format");
      }

      // State validation
      if (row.state && !states.includes(row.state)) {
        errors.push("Invalid state name");
      }

      // Business type validation
      if (row.businessType && !businessTypes.includes(row.businessType)) {
        warnings.push("Business type not in standard list");
      }

      // Warnings for missing optional fields
      if (!row.email && !row.phone) {
        warnings.push("Neither email nor phone provided");
      }

      return {
        row: index + 2, // +2 because header is row 1 and data starts from row 2
        data: row,
        errors,
        warnings
      };
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const text = await selectedFile.text();
      const data = parseCSV(text);
      
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(i);
      }

      setImportData(data);
      setCurrentStep("validate");
      
      toast({
        title: "File uploaded successfully",
        description: `${data.length} records found in the file.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to read the CSV file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleValidate = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate validation processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const results = validateData(importData);
      setValidationResults(results);
      setCurrentStep("review");
      
      const validCount = results.filter(r => r.errors.length === 0).length;
      toast({
        title: "Validation completed",
        description: `${validCount} valid records out of ${results.length} total.`,
      });
    } catch (error) {
      toast({
        title: "Validation failed",
        description: "An error occurred during validation.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    setIsProcessing(true);
    
    try {
      const validRecords = validationResults.filter(r => r.errors.length === 0);
      let successCount = 0;
      const errors: { row: number; error: string }[] = [];

      // Simulate import process
      for (let i = 0; i < validRecords.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Simulate random failures (10% chance)
        if (Math.random() < 0.1) {
          errors.push({
            row: validRecords[i].row,
            error: "Database error occurred"
          });
        } else {
          successCount++;
        }
      }

      setImportResults({
        success: successCount,
        failed: validRecords.length - successCount,
        errors
      });
      setCurrentStep("import");
      
      toast({
        title: "Import completed",
        description: `${successCount} clients imported successfully.`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "An error occurred during import.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([sampleCSVData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'client_import_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportData([]);
    setValidationResults([]);
    setImportResults({ success: 0, failed: 0, errors: [] });
    setCurrentStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Import Clients</h1>
            <p className="mt-2 text-gray-600">Import multiple clients from a CSV file</p>
          </div>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {[
                { step: "upload", label: "Upload File", icon: Upload },
                { step: "validate", label: "Validate", icon: AlertCircle },
                { step: "review", label: "Review", icon: Eye },
                { step: "import", label: "Import", icon: Save }
              ].map(({ step, label, icon: Icon }, index) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep === step 
                      ? "border-blue-500 bg-blue-500 text-white"
                      : validationResults.some(r => r.errors.length === 0) && 
                        ["review", "import"].includes(step)
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 bg-white text-gray-500"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep === step ? "text-blue-600" : "text-gray-500"
                  }`}>
                    {label}
                  </span>
                  {index < 3 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      index < ["upload", "validate", "review"].indexOf(currentStep)
                        ? "bg-blue-500"
                        : validationResults.some(r => r.errors.length === 0) && 
                          ["review", "import"].includes(step)
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Upload */}
        {currentStep === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Upload CSV File
              </CardTitle>
              <CardDescription>
                Upload a CSV file containing client data. Make sure to follow the required format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Required Columns:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      clientName (required)
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      businessName (required)
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      gstinNumber (required)
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      email (optional)
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      phone (optional)
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      pan (optional)
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Instructions:</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Download and use the sample format</li>
                    <li>• Ensure GSTIN format is correct</li>
                    <li>• Use standard state names</li>
                    <li>• Save file as CSV format</li>
                    <li>• Maximum 1000 records per file</li>
                  </ul>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Upload your CSV file</p>
                  <p className="text-sm text-gray-600">Drag and drop or click to browse</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="mt-4 space-y-2">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  <Button variant="outline" onClick={downloadSample}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Sample
                  </Button>
                </div>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Selected: {selectedFile.name}
                    </p>
                    <p className="text-xs text-green-600">
                      Size: {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? "Processing..." : "Next: Validate Data"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Validate */}
        {currentStep === "validate" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Validate Data
              </CardTitle>
              <CardDescription>
                Validating {importData.length} records for errors and warnings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isProcessing ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">Validating data...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Button variant="outline" onClick={() => setCurrentStep("upload")}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button onClick={handleValidate}>
                      Next: Review Results
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review */}
        {currentStep === "review" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Review Validation Results
              </CardTitle>
              <CardDescription>
                Review validation results before importing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        {validationResults.filter(r => r.errors.length === 0).length}
                      </div>
                      <p className="text-sm text-gray-600">Valid Records</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-600">
                        {validationResults.filter(r => r.errors.length > 0).length}
                      </div>
                      <p className="text-sm text-gray-600">Invalid Records</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-yellow-600">
                        {validationResults.filter(r => r.warnings.length > 0).length}
                      </div>
                      <p className="text-sm text-gray-600">Records with Warnings</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Validation Details:</h4>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {validationResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Row {result.row}</span>
                        <div className="flex items-center space-x-2">
                          {result.errors.length === 0 ? (
                            <Badge className="bg-green-100 text-green-800">Valid</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Invalid</Badge>
                          )}
                          {result.warnings.length > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              {result.warnings.length} Warning(s)
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <p><strong>Client:</strong> {result.data.clientName}</p>
                        <p><strong>Business:</strong> {result.data.businessName}</p>
                        <p><strong>GSTIN:</strong> {result.data.gstinNumber}</p>
                      </div>
                      
                      {result.errors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium text-red-700">Errors:</p>
                          {result.errors.map((error, errorIndex) => (
                            <p key={errorIndex} className="text-sm text-red-600">• {error}</p>
                          ))}
                        </div>
                      )}
                      
                      {result.warnings.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium text-yellow-700">Warnings:</p>
                          {result.warnings.map((warning, warningIndex) => (
                            <p key={warningIndex} className="text-sm text-yellow-600">• {warning}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setCurrentStep("validate")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={resetImport}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleImport}
                    disabled={validationResults.filter(r => r.errors.length === 0).length === 0}
                  >
                    Import {validationResults.filter(r => r.errors.length === 0).length} Valid Records
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Import Results */}
        {currentStep === "import" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Save className="h-5 w-5 mr-2" />
                Import Results
              </CardTitle>
              <CardDescription>
                Import process completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        {importResults.success}
                      </div>
                      <p className="text-sm text-gray-600">Successfully Imported</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-600">
                        {importResults.failed}
                      </div>
                      <p className="text-sm text-gray-600">Failed to Import</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {importResults.errors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Some records failed to import:</p>
                      {importResults.errors.map((error, index) => (
                        <p key={index} className="text-sm">
                          Row {error.row}: {error.error}
                        </p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={resetImport}>
                  Import More
                </Button>
                <Link href="/clients">
                  <Button>
                    <Users className="h-4 w-4 mr-2" />
                    View Clients
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}