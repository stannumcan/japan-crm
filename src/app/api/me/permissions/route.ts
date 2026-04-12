import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { defaultPermissions } from "@/lib/permissions";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("user_profiles")
    .select("profile_id, display_name, suspended, permission_profiles(id, name, permissions)")
    .eq("user_id", user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allProfiles } = await (supabase as any)
    .from("permission_profiles")
    .select("id, name")
    .order("name");

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profile ?? null,
    // If no profile assigned, grant full access (admin default)
    permissions: profile?.permission_profiles?.permissions ?? defaultPermissions(),
    allProfiles: allProfiles ?? [],
  });
}
