"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Upload,
  Download,
  FileText,
  Image,
  File,
  Calendar,
  User,
  Building,
  Tag,
  Eye,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

interface Document {
  id: number;
  fileName: string;
  fileType: string;
  category: string;
  uploadedAt: string;
  fileSize: string;
  clientName: string;
  businessName: string;
  extractedData?: any;
  processingStatus: "pending" | "processing" | "completed" | "failed";
}

const categories = [
  "Invoice",
  "Bank Statement",
  "Purchase Order",
  "Tax Return",
  "Financial Statement",
  "Agreement",
  "Others"
];

const fileTypes = [
  "PDF",
  "Image",
  "Excel",
  "Word",
  "Others"
];

export default function DocumentsPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockDocuments: Document[] = [
      {
        id: 1,
        fileName: "Invoice_001.pdf",
        fileType: "PDF",
        category: "Invoice",
        uploadedAt: "2024-03-15",
        fileSize: "2.4 MB",
        clientName: "ABC Enterprises",
        businessName: "ABC Manufacturing Unit",
        processingStatus: "completed",
        extractedData: {
          invoiceNumber: "INV-001",
          date: "2024-03-15",
          amount: 50000
        }
      },
      {
        id: 2,
        fileName: "Bank_Statement_March.xlsx",
        fileType: "Excel",
        category: "Bank Statement",
        uploadedAt: "2024-03-14",
        fileSize: "1.8 MB",
        clientName: "XYZ Solutions",
        businessName: "XYZ Tech Services",
        processingStatus: "processing"
      },
      {
        id: 3,
        fileName: "Purchase_Order_003.pdf",
        fileType: "PDF",
        category: "Purchase Order",
        uploadedAt: "2024-03-13",
        fileSize: "856 KB",
        clientName: "PQR Traders",
        businessName: "PQR Trading Co",
        processingStatus: "completed"
      },
      {
        id: 4,
        fileName: "Financial_Statement_Q4.pdf",
        fileType: "PDF",
        category: "Financial Statement",
        uploadedAt: "2024-03-12",
        fileSize: "3.2 MB",
        clientName: "ABC Enterprises",
        businessName: "ABC Manufacturing Unit",
        processingStatus: "pending"
      }
    ];

    setDocuments(mockDocuments);
    setFilteredDocuments(mockDocuments);
  }, []);

  useEffect(() => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.businessName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter(doc => doc.category === filterCategory);
    }

    if (filterType !== "all") {
      filtered = filtered.filter(doc => doc.fileType === filterType);
    }

    setFilteredDocuments(filtered);
  }, [searchTerm, filterCategory, filterType, documents]);

  const getDocumentStats = () => {
    return {
      total: documents.length,
      processed: documents.filter(d => d.processingStatus === "completed").length,
      processing: documents.filter(d => d.processingStatus === "processing").length,
      pending: documents.filter(d => d.processingStatus === "pending").length
    };
  };

  const stats = getDocumentStats();

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return <FileText className="h-8 w-8 text-red-500" />;
      case "image":
      case "jpg":
      case "jpeg":
      case "png":
        return <Image className="h-8 w-8 text-green-500" />;
      case "excel":
      case "xlsx":
      case "xls":
        return <File className="h-8 w-8 text-green-600" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadProgress(i);
      }

      // Simulate adding new documents
      const newDocuments = Array.from(selectedFiles).map((file, index) => ({
        id: documents.length + index + 1,
        fileName: file.name,
        fileType: file.type.split('/')[1].toUpperCase() || "Others",
        category: "Others",
        uploadedAt: new Date().toISOString().split('T')[0],
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        clientName: "New Client",
        businessName: "New Business",
        processingStatus: "pending" as const
      }));

      setDocuments(prev => [...prev, ...newDocuments]);
      setSelectedFiles(null);
      
      toast({
        title: "Upload successful",
        description: `${selectedFiles.length} file(s) uploaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="mt-2 text-gray-600">Manage and organize your client documents</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Documents</DialogTitle>
                  <DialogDescription>
                    Select documents to upload. Supported formats: PDF, Images, Excel, Word
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
                      onChange={handleFileSelect}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  {selectedFiles && selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Selected files:</p>
                      {Array.from(selectedFiles).map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{file.name}</span>
                          <span className="text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setSelectedFiles(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={isUploading || !selectedFiles}>
                      {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All documents</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processed</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processed}</div>
              <p className="text-xs text-muted-foreground">AI processed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <FileText className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processing}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <FileText className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search documents by name, client, or business..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {fileTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  {getFileIcon(document.fileType)}
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(document.processingStatus)}
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900 truncate">{document.fileName}</h3>
                    <p className="text-sm text-gray-500">{document.fileSize}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-3 w-3 mr-1" />
                      {document.clientName}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="h-3 w-3 mr-1" />
                      {document.businessName}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      {document.uploadedAt}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Tag className="h-3 w-3 mr-1" />
                      {document.category}
                    </div>
                  </div>
                  
                  {document.extractedData && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-green-800 mb-1">Extracted Data</p>
                      <div className="text-xs text-green-700 space-y-1">
                        {Object.entries(document.extractedData).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Get started by uploading your first document"}
              </p>
              {!searchTerm && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Upload Documents</DialogTitle>
                      <DialogDescription>
                        Select documents to upload. Supported formats: PDF, Images, Excel, Word
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
                        onChange={handleFileSelect}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                      {selectedFiles && selectedFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Selected files:</p>
                          {Array.from(selectedFiles).map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{file.name}</span>
                              <span className="text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setSelectedFiles(null)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUpload} disabled={!selectedFiles}>
                          Upload
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}