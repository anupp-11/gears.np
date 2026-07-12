import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/homepage-banners — public, used by homepage
export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
      .from("homepage_banners")
      .select("*")
      .order("position");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/homepage-banners — admin: update a banner (multipart: position, title, button_text, button_link, image?)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "staff"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const position = parseInt(formData.get("position") as string, 10);
    const title = formData.get("title") as string;
    const button_text = formData.get("button_text") as string;
    const button_link = formData.get("button_link") as string;
    const image = formData.get("image") as File | null;

    if (!position || ![1, 2].includes(position)) {
      return NextResponse.json({ error: "Invalid position" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      title: title ?? "",
      button_text: button_text || "Shop now",
      button_link: button_link || "/products",
      updated_at: new Date().toISOString(),
    };

    if (image && image.size > 0) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabaseAdmin.storage.createBucket("homepage-banners", { public: true }).catch(() => {});
      const ext = image.name.split(".").pop() ?? "jpg";
      const fileName = `banner-${position}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("homepage-banners")
        .upload(fileName, image, { cacheControl: "3600", upsert: false });
      if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from("homepage-banners").getPublicUrl(fileName);
      updateData.image_url = publicUrl;
    }

    const { data, error } = await supabase
      .from("homepage_banners")
      .update(updateData)
      .eq("position", position)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
