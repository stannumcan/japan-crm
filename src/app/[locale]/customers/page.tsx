import { getTranslations } from "next-intl/server";

export default async function CustomersPage() {
  const t = await getTranslations("nav");
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("customers")}</h1>
      <p className="text-gray-500 mt-2">Coming soon.</p>
    </div>
  );
}
