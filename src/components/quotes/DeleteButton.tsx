"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  /** API endpoint to DELETE, e.g. "/api/quotes/abc123" or "/api/factory-sheets?id=abc123" */
  endpoint: string;
  /** Label for the confirm dialog */
  label?: string;
}

export default function DeleteButton({ endpoint, label = "this record" }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(endpoint, { method: "DELETE" });
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0"
      title="Delete"
      onClick={handleDelete}
      disabled={deleting}
    >
      {deleting
        ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        : <Trash2 className="h-3.5 w-3.5 text-red-500" />
      }
    </Button>
  );
}
