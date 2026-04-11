import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CustomerQuoteForm from "@/components/customer/CustomerQuoteForm";

export default async function CustomerQuotePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const tc = await getTranslations("common");

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quote } = await (supabase as any)
    .from("quotations")
    .select(`
      id, status, mold_type, mold_number, size_dimensions, embossment,
      design_count, shipping_info_required,
      printing_lid, printing_body, printing_bottom, printing_inner, printing_notes,
      work_orders(id, wo_number, company_name, project_name, company_id),
      quotation_quantity_tiers(tier_label, quantity_type, quantity, sort_order),
      natsuki_ddp_calculations!quotation_id(
        id, tier_label, quantity, unit_price_jpy, total_revenue_jpy,
        selected_margin, shipping_cost_jpy, total_cost_jpy, manufacturing_cost_jpy,
        fx_rate_rmb_to_jpy
      ),
      factory_cost_sheets(
        mold_cost_new, mold_cost_modify, mold_lead_time_days,
        steel_type, steel_thickness, product_dimensions, outer_carton_qty, outer_carton_config, mold_number
      ),
      customer_quotes(*)
    `)
    .eq("id", id)
    .single();

  if (!quote) notFound();

  const wo = quote.work_orders as {
    id: string;
    wo_number: string;
    company_name: string;
    project_name: string;
    company_id: string | null;
  } | null;

  // Fetch contacts for this company if we have a company_id
  type Contact = { id: string; name: string; department: string | null; phone: string | null; phone_direct: string | null };
  let contacts: Contact[] = [];
  if (wo?.company_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contactRows } = await (supabase as any)
      .from("company_contacts")
      .select("id, name, department, phone, phone_direct")
      .eq("company_id", wo.company_id)
      .order("is_primary", { ascending: false })
      .order("name");
    contacts = (contactRows as Contact[]) ?? [];
  }

  const ddpCalcs = (quote.natsuki_ddp_calculations as {
    id: string;
    tier_label: string;
    quantity: number;
    unit_price_jpy: number | null;
    total_revenue_jpy: number | null;
    selected_margin: number | null;
    shipping_cost_jpy: number | null;
    total_cost_jpy: number | null;
    manufacturing_cost_jpy: number | null;
    fx_rate_rmb_to_jpy: number | null;
  }[]) ?? [];

  const sheets = Array.isArray(quote.factory_cost_sheets)
    ? quote.factory_cost_sheets
    : [quote.factory_cost_sheets].filter(Boolean);

  const sheet = (sheets as {
    mold_cost_new: number | null;
    mold_cost_modify: number | null;
    mold_lead_time_days: number | null;
    steel_type: string | null;
    steel_thickness: number | null;
    product_dimensions: string | null;
    outer_carton_qty: number | null;
    outer_carton_config: string | null;
    mold_number: string | null;
  }[] | null)?.[0] ?? null;

  const existingCQ = Array.isArray(quote.customer_quotes)
    ? (quote.customer_quotes as Record<string, unknown>[])[0] ?? null
    : (quote.customer_quotes as Record<string, unknown> | null);

  // Compute default printing lines from quotation fields
  const defaultPrintingLines = [
    quote.printing_lid && { surface: "外面", part: "蓋", spec: quote.printing_lid as string },
    quote.printing_body && { surface: "外面", part: "身", spec: quote.printing_body as string },
    quote.printing_bottom && { surface: "外面", part: "底", spec: quote.printing_bottom as string },
    quote.printing_inner && { surface: "内面", part: "蓋", spec: quote.printing_inner as string },
  ].filter(Boolean) as { surface: string; part: string; spec: string }[];

  const defaultMaterial = sheet?.steel_type ?? "スタンダード";
  const defaultThickness = sheet?.steel_thickness ? `${sheet.steel_thickness}㎜` : "";
  const defaultPacking = [
    sheet?.outer_carton_qty && `${sheet.outer_carton_qty}缶/箱`,
    sheet?.outer_carton_config,
  ].filter(Boolean).join("　");

  // Prefer factory sheet product_dimensions (per-mold), fall back to quotation size_dimensions
  const sizeNote = sheet?.product_dimensions ?? (quote.size_dimensions as string) ?? "";

  // Fetch image attachments for this quotation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: attachmentRows } = await (supabase as any)
    .from("quotation_attachments")
    .select("file_name, file_url, file_type")
    .eq("quotation_id", id)
    .order("uploaded_at", { ascending: false });

  const quoteImages = ((attachmentRows ?? []) as { file_name: string; file_url: string; file_type: string | null }[])
    .filter((a) => (a.file_type ?? "").startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp)$/i.test(a.file_name))
    .map((a) => ({ name: a.file_name, url: a.file_url }));

  // Fetch mold image from the molds table (by mold_number on factory sheet)
  const moldNumber = sheet?.mold_number ?? null;
  let moldImageUrl: string | null = null;
  if (moldNumber) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: moldRow } = await (supabase as any)
      .from("molds")
      .select("image_url")
      .eq("mold_number", moldNumber)
      .maybeSingle();
    moldImageUrl = moldRow?.image_url ?? null;
  }

  // Get FX rate from the first DDP calc
  const fxRateFromDDP = ddpCalcs[0]?.fx_rate_rmb_to_jpy ?? null;

  if (ddpCalcs.length === 0) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/${locale}/quotes/${id}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {tc("back")}
            </Button>
          </Link>
        </div>
        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-8 text-center text-amber-700">
          <p className="font-medium">DDP calculation not found.</p>
          <p className="text-sm mt-1">Natsuki must complete the DDP calculation first.</p>
          <Link href={`/${locale}/quotes/${id}/ddp-calc`} className="inline-block mt-4">
            <Button variant="outline">Go to DDP Calc</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/quotes/${id}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {tc("back")}
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">御見積書 — Customer Quote</h1>
          {wo && (
            <p className="text-sm text-gray-500">
              {wo.wo_number} · {wo.project_name} · {wo.company_name}
            </p>
          )}
        </div>
      </div>

      <CustomerQuoteForm
        locale={locale}
        quoteId={id}
        woNumber={wo?.wo_number ?? ""}
        companyName={wo?.company_name ?? ""}
        companyId={wo?.company_id ?? null}
        contacts={contacts}
        projectName={wo?.project_name ?? ""}
        sizeNote={sizeNote}
        ddpCalcs={ddpCalcs}
        moldType={(quote.mold_type as string) ?? "existing"}
        moldCostNew={sheet?.mold_cost_new ?? null}
        moldLeadTimeDays={sheet?.mold_lead_time_days ?? null}
        defaultMaterial={defaultMaterial}
        defaultThickness={defaultThickness}
        defaultPrintingLines={defaultPrintingLines}
        defaultPacking={defaultPacking}
        fxRateFromDDP={fxRateFromDDP}
        quoteImages={quoteImages}
        moldImageUrl={moldImageUrl}
        existingCQ={existingCQ}
      />
    </div>
  );
}
