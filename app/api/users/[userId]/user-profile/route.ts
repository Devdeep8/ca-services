import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const formData = await req.formData();
    const avatarFile = formData.get("avatar") as File | null;

    if (!avatarFile) {
      return NextResponse.json(
        { error: "No avatar file was provided." },
        { status: 400 }
      );
    }
    const fileExtension = avatarFile.name.split(".").pop();
    const filePath = `${userId}/${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("project-prabisha-user-profile")
      .upload(filePath, avatarFile);
    if (uploadError) {
      console.error("Supabase Upload Error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload the image." },
        { status: 500 }
      );
    }

    const { data } = supabaseAdmin.storage
      .from("project-prabisha-user-profile")
      .getPublicUrl(filePath);
    if (!data.publicUrl) {
      return NextResponse.json(
        { error: "Could not retrieve the public URL." },
        { status: 500 }
      );
    }

    const imageUrl = data.publicUrl;

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
