// app/api/feedback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { getServerSession } from "next-auth/next"; // ✅ Import session utilities
import { authOptions } from "@/lib/auth"; // ✅ Import your auth options

export async function POST(req: NextRequest) {
  try {
    // --- 1. Get the current user's session ---
    const session = await getServerSession(authOptions);
    const user = session?.user;

    // --- 2. Get form data (no change here) ---
    const formData = await req.formData();
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;
    const pathname = formData.get("pathname") as string;
    const attachmentFile = formData.get("attachment") as File | null;

    // --- Validation (no change here) ---
    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
    }

    // --- Attachment Handling (no change here) ---
    const attachments = [];
    if (attachmentFile) {
      if (attachmentFile.size > 4 * 1024 * 1024) { // 4MB limit
        return NextResponse.json({ error: "Attachment size cannot exceed 4MB." }, { status: 400 });
      }
      const bytes = await attachmentFile.arrayBuffer();
      const content = Buffer.from(bytes);
      attachments.push({ filename: attachmentFile.name, content });
    }

    // --- 3. Prepare Email with User and Location Data ---
    const emailHtml = `
      <h1>Website Feedback Received</h1>
      <hr>
      <h2>Submitted By:</h2>
      <p><strong>Name:</strong> ${user?.name || "Anonymous Guest"}</p>
      <p><strong>Email:</strong> ${user?.email || "Not logged in"}</p>
      <hr>
      <h2>Details:</h2>
      <p><strong>From Page:</strong> ${pathname}</p>
      <hr>
      <h2>Message:</h2>
      <p style="white-space: pre-wrap;">${message}</p>
    `;

    // --- Send Email (no change here) ---
    await sendMail({
      to: process.env.ADMIN_EMAILS!,
      subject: subject,
      html: emailHtml,
      attachments: attachments,
    });

    return NextResponse.json({ message: "Feedback sent successfully!" }, { status: 200 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}