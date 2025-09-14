"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Building,
  Users,
  FileText,
  Download
} from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  pan?: string;
  address?: string;
  businesses: Business[];
  createdAt: string;
}

interface Business {
  id: number;
  name: string;
  type?: string;
  gstins: GSTIN[];
}

interface GSTIN {
  id: number;
  gstinNumber: string;
  state: string;
  status: string;
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockClients: Client[] = [
      {
        id: 1,
        name: "ABC Enterprises Pvt Ltd",
        email: "contact@abc.com",
        phone: "+91 9876543210",
        pan: "ABCDE1234F",
        address: "Mumbai, Maharashtra",
        businesses: [
          {
            id: 1,
            name: "ABC Manufacturing Unit",
            type: "Manufacturing",
            gstins: [
              { id: 1, gstinNumber: "27ABCDE1234F1Z5", state: "Maharashtra", status: "Active" }
            ]
          }
        ],
        createdAt: "2024-01-15"
      },
      {
        id: 2,
        name: "XYZ Solutions",
        email: "info@xyz.com",
        phone: "+91 8765432109",
        pan: "FGHIJ5678G",
        address: "Bangalore, Karnataka",
        businesses: [
          {
            id: 2,
            name: "XYZ Tech Services",
            type: "Services",
            gstins: [
              { id: 2, gstinNumber: "29FGHIJ5678G1Z5", state: "Karnataka", status: "Active" }
            ]
          }
        ],
        createdAt: "2024-02-01"
      },
      {
        id: 3,
        name: "PQR Traders",
        email: "pqr@traders.com",
        phone: "+91 7654321098",
        pan: "KLMNO9012H",
        address: "Delhi, Delhi",
        businesses: [
          {
            id: 3,
            name: "PQR Trading Co",
            type: "Trading",
            gstins: [
              { id: 3, gstinNumber: "07KLMNO9012H1Z5", state: "Delhi", status: "Active" }
            ]
          }
        ],
        createdAt: "2024-02-15"
      }
    ];

    setClients(mockClients);
    setFilteredClients(mockClients);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.pan?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const getClientStats = () => {
    return {
      total: clients.length,
      active: clients.filter(c => c.businesses.some(b => b.gstins.some(g => g.status === "Active"))).length,
      withMultipleGSTIN: clients.filter(c => c.businesses.reduce((sum, b) => sum + b.gstins.length, 0) > 1).length
    };
  };

  const stats = getClientStats();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="mt-2 text-gray-600">Manage your client profiles and their GST registrations</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link href="/clients/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Active client profiles</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active GSTINs</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Active registrations</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Multi-GSTIN</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withMultipleGSTIN}</div>
              <p className="text-xs text-muted-foreground">Clients with multiple GSTINs</p>
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
                  placeholder="Search clients by name, email, or PAN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <div className="mt-2 space-y-1">
                        {client.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {client.phone}
                          </div>
                        )}
                        {client.pan && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FileText className="h-4 w-4 mr-2" />
                            PAN: {client.pan}
                          </div>
                        )}
                        {client.address && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {client.address}
                          </div>
                        )}
                      </div>
                      
                      {/* Businesses and GSTINs */}
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Businesses & GSTINs</h4>
                        <div className="space-y-2">
                          {client.businesses.map((business) => (
                            <div key={business.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{business.name}</p>
                                  {business.type && (
                                    <p className="text-xs text-gray-600">{business.type}</p>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 space-y-1">
                                {business.gstins.map((gstin) => (
                                  <div key={gstin.id} className="flex items-center justify-between text-xs">
                                    <span className="font-mono">{gstin.gstinNumber}</span>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-gray-600">{gstin.state}</span>
                                      <Badge variant={gstin.status === "Active" ? "default" : "secondary"} className="text-xs">
                                        {gstin.status}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/clients/${client.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first client"}
              </p>
              {!searchTerm && (
                <Link href="/clients/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Client
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}