// Fire-and-forget workflow email notification
// Call this server-side after a quotation status change

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://japan-crm.vercel.app";

export async function notifyWorkflowStep(quotationId: string, newStatus: string) {
  try {
    await fetch(`${APP_URL}/api/workflow/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quotation_id: quotationId, new_status: newStatus }),
    });
  } catch {
    // Don't block the main operation if email fails
    console.error(`[workflow-notify] Failed to notify for ${quotationId} → ${newStatus}`);
  }
}
