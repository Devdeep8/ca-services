"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, BarChart3, Zap } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (session) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">CA Practice Automation</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push("/auth/sign-in")}>
                Sign In
              </Button>
              <Button onClick={() => router.push("/auth/sign-up")}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Streamline Your CA Practice with
            <span className="text-blue-600"> AI-Powered Automation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive platform for Chartered Accountants to manage GST returns, ITR filings, 
            and client relationships with intelligent automation and real-time insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => router.push("/auth/sign-up")}>
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push("/auth/sign-in")}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need to Grow Your Practice
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <FileText className="h-8 w-8 mx-auto text-blue-600 mb-4" />
                <CardTitle className="text-lg">GST & ITR Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Bulk processing of GSTR-1, GSTR-3B, and Income Tax Returns with automated reconciliation.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-8 w-8 mx-auto text-green-600 mb-4" />
                <CardTitle className="text-lg">Client Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Multi-GSTIN client profiles, automated reminders, and comprehensive document tracking.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="h-8 w-8 mx-auto text-purple-600 mb-4" />
                <CardTitle className="text-lg">Smart Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Real-time insights, compliance tracking, and practice performance metrics.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Zap className="h-8 w-8 mx-auto text-orange-600 mb-4" />
                <CardTitle className="text-lg">AI-Powered</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Intelligent data extraction, reconciliation explanations, and automated communication drafting.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-900">Ready to Transform Your Practice?</CardTitle>
              <CardDescription className="text-blue-700">
                Join hundreds of CA firms who are already saving time and growing their practice with our platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" onClick={() => router.push("/auth/sign-up")}>
                Get Started Today
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2024 CA Practice Automation. Built with Next.js and AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}