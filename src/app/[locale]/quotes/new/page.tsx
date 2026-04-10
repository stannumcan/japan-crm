import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import QuoteRequestForm from "@/components/quotes/QuoteRequestForm";

export default async function NewQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    wo_id?: string;
    wo_number?: string;
    company_id?: string;
    company_name?: string;
  }>;
}) {
  const { locale } = await params;
  const { wo_id, wo_number, company_id, company_name } = await searchParams;
  const t = await getTranslations("quotes");
  const tc = await getTranslations("common");

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={wo_id ? `/${locale}/workorders/${wo_id}` : `/${locale}/quotes`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {tc("back")}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t("new")}</h1>
      </div>

      <QuoteRequestForm
        locale={locale}
        prefilledWoId={wo_id}
        prefilledWoNumber={wo_number}
        prefilledCompanyId={company_id}
        prefilledCompanyName={company_name}
      />
    </div>
  );
}
