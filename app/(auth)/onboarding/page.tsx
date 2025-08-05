"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { workspaceSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import axios from "axios"
import { useWorkspaceCheck } from "@/hooks/useWorkspaceCheck"
export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

  useWorkspaceCheck(setStep, setWorkspaceId)

  // Step 1: Org creation
  const form = useForm({
    resolver: zodResolver(workspaceSchema.pick({ name: true })),
    defaultValues: { name: "" },
  })

  // Step 2: Invite users
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const onSubmit = async (data: { name: string }) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await axios.post("/api/onboarding", data)
      if (response.status === 201) {
        setWorkspaceId(response.data.workspace.id)
        setStep(2)
      } else {
        setError(response.data.error || "Something went wrong.")
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError(null)
    setInviteSuccess(null)
    if (!inviteEmail || !workspaceId) return
    try {
      const response = await axios.post("/api/invite", { email: inviteEmail, workspaceId })
      if (response.status === 200) {
        setInviteSuccess("Invitation sent!")
        setInviteEmail("")
      } else {
        setInviteError(response.data.error || "Failed to send invite.")
      }
    } catch (err: any) {
      setInviteError(err.response?.data?.error || "Failed to send invite.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Onboarding</CardTitle>
            <CardDescription>
              {step === 1 ? "Enter your organization (workspace) name to get started." : "Invite your team members by email."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="Enter your organization name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Setting up..." : "Continue"}
                  </Button>
                </form>
              </Form>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invite by Email</label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                </div>
                {inviteError && <div className="text-red-500 text-sm">{inviteError}</div>}
                {inviteSuccess && <div className="text-green-600 text-sm">{inviteSuccess}</div>}
                <Button type="submit" className="w-full" disabled={!inviteEmail}>
                  Send Invite
                </Button>
                <Button type="button" className="w-full mt-2" variant="secondary" onClick={() => window.location.href = "/projects"}>
                  Finish
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}