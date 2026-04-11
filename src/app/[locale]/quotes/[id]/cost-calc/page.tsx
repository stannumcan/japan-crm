import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import WilfredCalcForm from "@/components/calculator/WilfredCalcForm";

export default async function CostCalcPage({
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
      id, status,
      work_orders(wo_number, company_name, project_name),
      factory_cost_sheets(
        id,
        mold_number,
        factory_cost_tiers(*),
        wilfred_calculations(*)
      )
    `)
    .eq("id", id)
    .single();

  if (!quote) notFound();

  const wo = quote.work_orders as { wo_number: string; company_name: string; project_name: string } | null;

  type Sheet = {
    id: string;
    mold_number: string | null;
    factory_cost_tiers: {
      id: string;
      tier_label: string;
      quantity: number;
      total_subtotal: number | null;
      labor_cost: number | null;
      accessories_cost: number | null;
      container_info: string | null;
    }[];
    wilfred_calculations: {
      id: string;
      tier_label: string;
      total_subtotal: number;
      labor_cost: number;
      accessories_cost: number;
      overhead_multiplier: number;
      margin_rate: number;
      estimated_cost_rmb: number | null;
      approved: boolean;
      wilfred_notes: string | null;
    }[];
  };

  const sheets: Sheet[] = Array.isArray(quote.factory_cost_sheets)
    ? quote.factory_cost_sheets
    : quote.factory_cost_sheets
    ? [quote.factory_cost_sheets]
    : [];

  if (sheets.length === 0) {
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
          <p className="font-medium">Factory cost sheet not found.</p>
          <p className="text-sm mt-1">Annie must submit the factory cost sheet first.</p>
          <Link href={`/${locale}/quotes/${id}/factory-sheet`} className="inline-block mt-4">
            <Button variant="outline">Go to Factory Sheet</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/quotes/${id}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {tc("back")}
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Wilfred Cost Calculation</h1>
          {wo && (
            <p className="text-sm text-gray-500">{wo.wo_number} · {wo.project_name} · {wo.company_name}</p>
          )}
        </div>
      </div>

      {sheets.length === 1 ? (
        <WilfredCalcForm
          locale={locale}
          quoteId={id}
          costSheetId={sheets[0].id}
          factoryTiers={sheets[0].factory_cost_tiers ?? []}
          existingCalcs={sheets[0].wilfred_calculations ?? []}
        />
      ) : (
        <Tabs defaultValue={sheets[0].id}>
          <TabsList className="mb-4">
            {sheets.map((sheet, i) => (
              <TabsTrigger key={sheet.id} value={sheet.id}>
                {sheet.mold_number ?? `Sheet ${i + 1}`}
              </TabsTrigger>
            ))}
          </TabsList>
          {sheets.map((sheet) => (
            <TabsContent key={sheet.id} value={sheet.id}>
              <WilfredCalcForm
                locale={locale}
                quoteId={id}
                costSheetId={sheet.id}
                factoryTiers={sheet.factory_cost_tiers ?? []}
                existingCalcs={sheet.wilfred_calculations ?? []}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
