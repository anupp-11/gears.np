import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// GET /api/settings - Get settings
export async function GET() {
  try {
    const supabase = await supabaseServer();

    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/settings - Update settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await supabaseServer();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type");
    
    // Handle FormData (with image upload)
    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      
      const updateData: Record<string, unknown> = {
        site_name: formData.get("site_name") as string,
        hero_title: formData.get("hero_title") as string | null,
        hero_subtitle: formData.get("hero_subtitle") as string | null,
        promo_text: formData.get("promo_text") as string | null,
        primary_color: formData.get("primary_color") as string,
        secondary_color: formData.get("secondary_color") as string,
        support_phone: formData.get("support_phone") as string | null,
        support_email: formData.get("support_email") as string | null,
        instagram_url: formData.get("instagram_url") as string | null,
        tiktok_url: formData.get("tiktok_url") as string | null,
        show_hero_banner: formData.get("show_hero_banner") === "true",
        updated_at: new Date().toISOString(),
      };

      // Handle banner image upload if provided
      const banner_image = formData.get("banner_image") as File | null;
      if (banner_image && banner_image.size > 0) {
        const fileExt = banner_image.name.split(".").pop();
        const fileName = `banner-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("event-banners")
          .upload(filePath, banner_image, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("event-banners").getPublicUrl(filePath);

        updateData.banner_image_url = publicUrl;
      }

      // Handle logo upload if provided
      const logo_image = formData.get("logo_image") as File | null;
      if (logo_image && logo_image.size > 0) {
        const fileExt = logo_image.name.split(".").pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("team-logos")
          .upload(filePath, logo_image, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("team-logos").getPublicUrl(filePath);

        updateData.logo_url = publicUrl;
      }

      // Handle favicon upload if provided
      const favicon_image = formData.get("favicon_image") as File | null;
      if (favicon_image && favicon_image.size > 0) {
        const fileExt = favicon_image.name.split(".").pop();
        const fileName = `favicon-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("team-logos")
          .upload(filePath, favicon_image, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("team-logos").getPublicUrl(filePath);

        updateData.favicon_url = publicUrl;
      }

      // Handle OG image upload if provided
      const og_image = formData.get("og_image") as File | null;
      if (og_image && og_image.size > 0) {
        const fileExt = og_image.name.split(".").pop();
        const fileName = `og-image-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("event-banners")
          .upload(filePath, og_image, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("event-banners").getPublicUrl(filePath);

        updateData.og_image_url = publicUrl;
      }

      // Update settings (always id = 1)
      const { data, error } = await supabase
        .from("settings")
        .update(updateData)
        .eq("id", 1)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(data);
    } else {
      // Handle JSON (without image upload)
      const body = await request.json();

      // Update settings (always id = 1)
      const { data, error } = await supabase
        .from("settings")
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(data);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
