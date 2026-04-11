import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { company_id, name, department, phone, phone_direct } = body;

  if (!company_id || !name) {
    return NextResponse.json({ error: "company_id and name are required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("company_contacts")
    .insert({ company_id, name, department: department || null, phone: phone || null, phone_direct: phone_direct || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
