"use client"

import type React from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Loader2, Paperclip, Send, X, Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function FeedbackDialog({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [subject, setSubject] = useState("Feature Request")
  const [message, setMessage] = useState("")
  const [attachment, setAttachment] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      toast.error("Please enter a message before sending.")
      return
    }

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("message", message)
    formData.append("pathname", pathname)
    formData.append("subject", subject)
    if (attachment) {
      formData.append("attachment", attachment)
    }

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Something went wrong.")
      }

      toast.success("Your message has been sent successfully!")
      setMessage("")
      setAttachment(null)
      setOpen(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setMessage("")
    setAttachment(null)
    setOpen(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="bg-card border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold text-card-foreground">New Message</h2>
                </div>
                {/* <Button type="button" variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button> */}
              </div>
            </div>

            <div className="px-6 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground min-w-[40px]">To:</span>
                <span className="text-sm text-foreground bg-secondary/20 px-3 py-1 rounded-full">Support Team</span>
              </div>
            </div>

            <div className="px-6 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground min-w-[40px]">Subject:</span>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0 text-sm font-medium w-full">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feature Request">Feature Request</SelectItem>
                    <SelectItem value="Bug Report">Not Working</SelectItem>
                    <SelectItem value="General Feedback">General Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <Textarea
                placeholder="Hi there,&#10;&#10;I wanted to share some feedback about..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={12}
                className="border-0 bg-transparent resize-none focus-visible:ring-0 text-sm leading-relaxed p-0"
              />
            </div>

            {attachment && (
              <div className="px-6 py-3 border-t border-border bg-muted/30">
                <div className="flex items-center gap-2 text-sm">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{attachment.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAttachment(null)}
                    className="h-6 w-6 p-0 ml-auto"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="px-6 py-4 border-t border-border bg-card/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label htmlFor="attachment-input">
                    <Button type="button" variant="ghost" size="sm" className="h-9 px-3" asChild>
                      <span className="cursor-pointer">
                        <Paperclip className="w-4 h-4 mr-2" />
                        Attach
                      </span>
                    </Button>
                  </label>
                  <input
                    id="attachment-input"
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setAttachment(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                  />
                  <span className="text-xs text-muted-foreground">Images & videos (max 4MB)</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                    Discard
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}