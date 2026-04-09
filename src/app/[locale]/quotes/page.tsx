import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  sent: "default",
  approved: "outline",
  rejected: "destructive",
  expired: "secondary",
};

// Placeholder data — will be replaced by Supabase
const MOCK_QUOTES = [
  {
    id: "Q-2024-001",
    customer: "田中商事",
    date: "2024-01-15",
    validUntil: "2024-02-15",
    status: "sent",
    amount: 1250000,
    currency: "JPY",
  },
  {
    id: "Q-2024-002",
    customer: "上海科技有限公司",
    date: "2024-01-18",
    validUntil: "2024-02-18",
    status: "draft",
    amount: 8500,
    currency: "USD",
  },
  {
    id: "Q-2024-003",
    customer: "Maple Trading Co.",
    date: "2024-01-20",
    validUntil: "2024-02-20",
    status: "approved",
    amount: 12400,
    currency: "CAD",
  },
];

export default async function QuotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("quotes");
  const tc = await getTranslations("common");

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale === "ja" ? "ja-JP" : locale === "zh" ? "zh-CN" : "en-CA", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{MOCK_QUOTES.length} quotes</p>
        </div>
        <Link href={`/${locale}/quotes/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("new")}
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("quoteNumber")}</TableHead>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("validUntil")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
              <TableHead className="text-right">{t("amount")}</TableHead>
              <TableHead className="w-20">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_QUOTES.map((quote) => (
              <TableRow key={quote.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-blue-600">
                  <Link href={`/${locale}/quotes/${quote.id}`}>
                    {quote.id}
                  </Link>
                </TableCell>
                <TableCell>{quote.customer}</TableCell>
                <TableCell>{quote.date}</TableCell>
                <TableCell>{quote.validUntil}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_COLORS[quote.status] as "default" | "secondary" | "destructive" | "outline"}>
                    {t(`statuses.${quote.status}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatAmount(quote.amount, quote.currency)}
                </TableCell>
                <TableCell>
                  <Link href={`/${locale}/quotes/${quote.id}`}>
                    <Button variant="ghost" size="sm">{tc("edit")}</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
