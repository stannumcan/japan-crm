import { createAdminClient } from "@/lib/supabase/admin";
import { getResend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email";
import { buildQuoteEmail } from "@/lib/email-template";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://japan-crm.vercel.app";

export async function notifyWorkflowStep(quotationId: string, newStatus: string) {
  try {
    const supabase = createAdminClient();

    // Get workflow step config
    const { data: step } = await supabase
      .from("workflow_steps")
      .select("*")
      .eq("step_key", newStatus)
      .single();

    if (!step || !step.send_email || !step.assignee_emails?.length) {
      return;
    }

    // Get quotation + work order info
    const { data: quote } = await supabase
      .from("quotations")
      .select("*, work_orders(wo_number, company_name, project_name)")
      .eq("id", quotationId)
      .single();

    if (!quote) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wo = (quote as any).work_orders;
    const woNumber = wo?.wo_number ?? "—";
    const companyName = wo?.company_name ?? "—";
    const projectName = wo?.project_name ?? "—";

    const sections = buildSections(quote);

    const html = buildQuoteEmail({
      stepLabel: step.label,
      taskDescription: step.task_description,
      woNumber,
      companyName,
      projectName,
      quoteVersion: quote.quote_version ?? 1,
      sections,
      ctaUrl: `${APP_URL}/en/quotes/${quotationId}/request`,
      ctaLabel: "Open in CRM",
    });

    const subject = `[${woNumber}] ${step.label} — ${companyName}`;

    const resend = getResend();

    for (const email of step.assignee_emails) {
      const { data: sendResult, error: sendError } = await resend.emails.send({
        from: EMAIL_FROM,
        replyTo: EMAIL_REPLY_TO,
        to: email,
        subject,
        html,
      });

      if (sendError) {
        console.error(`[workflow-notify] Resend error for ${email}:`, JSON.stringify(sendError));
        continue;
      }

      console.log(`[workflow-notify] Email sent to ${email}, id: ${sendResult?.id}`);

      await supabase.from("workflow_email_log").insert({
        quotation_id: quotationId,
        step_key: newStatus,
        recipient_email: email,
        subject,
      });
    }
  } catch (err) {
    console.error(`[workflow-notify] Failed for ${quotationId} → ${newStatus}:`, err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSections(quote: any) {
  const sections: { label: string; rows: { label: string; value: string }[] }[] = [];

  const basic: { label: string; value: string }[] = [];
  if (quote.urgency) basic.push({ label: "Urgency", value: "Urgent" });
  if (quote.deadline) basic.push({ label: "Deadline", value: new Date(quote.deadline).toLocaleDateString() });
  if (basic.length > 0) sections.push({ label: "Quote Details", rows: basic });

  if (quote.mold_number || quote.can_size) {
    const mold: { label: string; value: string }[] = [];
    if (quote.mold_number) mold.push({ label: "Mold #", value: quote.mold_number });
    if (quote.can_size) mold.push({ label: "Can Size", value: quote.can_size });
    if (quote.tin_thickness) mold.push({ label: "Thickness", value: `${quote.tin_thickness}mm` });
    sections.push({ label: "Mold Information", rows: mold });
  }

  if (quote.printing_interior || quote.printing_exterior) {
    const print: { label: string; value: string }[] = [];
    if (quote.printing_interior) print.push({ label: "Interior", value: quote.printing_interior });
    if (quote.printing_exterior) print.push({ label: "Exterior", value: quote.printing_exterior });
    if (quote.embossment) print.push({ label: "Embossment", value: quote.embossment });
    sections.push({ label: "Printing & Finish", rows: print });
  }

  return sections;
}
