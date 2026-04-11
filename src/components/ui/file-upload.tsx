"use client";

import { useState, useRef, useCallback, useId } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, FileText, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  name: string;
  path: string;
  size: number;
  type: string;
  url: string;
}

interface FileEntry {
  uid: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "done" | "error";
  error?: string;
  result?: UploadedFile;
}

interface FileUploadProps {
  sessionId: string;
  onChange: (files: UploadedFile[]) => void;
  className?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const SUPABASE_URL = "https://lwdxvcrvrzlfetelcemt.supabase.co";
const BUCKET = "quote-attachments";

export function FileUpload({ sessionId, onChange, className }: FileUploadProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  const notify = useCallback((updated: FileEntry[]) => {
    onChange(updated.filter((e) => e.status === "done").map((e) => e.result!));
  }, [onChange]);

  const uploadFile = useCallback(async (file: File, entryId: string) => {
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `drafts/${sessionId}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      setEntries((prev) => {
        const next = prev.map((e) =>
          e.uid === entryId ? { ...e, status: "error" as const, error: error.message } : e
        );
        notify(next);
        return next;
      });
      return;
    }

    const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
    const result: UploadedFile = { name: file.name, path, size: file.size, type: file.type, url };

    setEntries((prev) => {
      const next = prev.map((e) =>
        e.uid === entryId ? { ...e, status: "done" as const, result } : e
      );
      notify(next);
      return next;
    });
  }, [sessionId, notify]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const newEntries: FileEntry[] = arr.map((f) => ({
      uid: `${uid}-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: f.size,
      type: f.type,
      status: "uploading",
    }));
    setEntries((prev) => [...prev, ...newEntries]);
    newEntries.forEach((entry, i) => uploadFile(arr[i], entry.uid));
  }, [uid, uploadFile]);

  const removeEntry = useCallback(async (entry: FileEntry) => {
    if (entry.result?.path) {
      const supabase = createClient();
      await supabase.storage.from(BUCKET).remove([entry.result.path]);
    }
    setEntries((prev) => {
      const next = prev.filter((e) => e.uid !== entry.uid);
      notify(next);
      return next;
    });
  }, [notify]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const fileIcon = (type: string) => {
    if (type.startsWith("image/")) return "🖼";
    if (type === "application/pdf") return "📄";
    if (type.includes("spreadsheet") || type.includes("excel")) return "📊";
    if (type.includes("word") || type.includes("document")) return "📝";
    return "📎";
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-colors",
          dragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        )}
      >
        <Upload className="h-6 w-6 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          Drop files here or <span className="text-blue-600 font-medium">browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, images, Office docs — up to 50 MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {entries.length > 0 && (
        <ul className="space-y-1.5">
          {entries.map((entry) => (
            <li
              key={entry.uid}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md border text-sm",
                entry.status === "error"
                  ? "border-red-200 bg-red-50"
                  : entry.status === "done"
                  ? "border-gray-100 bg-gray-50"
                  : "border-blue-100 bg-blue-50"
              )}
            >
              {entry.status === "uploading" ? (
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />
              ) : entry.status === "error" ? (
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              ) : (
                <span className="text-base leading-none flex-shrink-0">{fileIcon(entry.type)}</span>
              )}

              <div className="flex-1 min-w-0">
                {entry.status === "done" && entry.result ? (
                  <a
                    href={entry.result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-700 hover:underline truncate block"
                  >
                    {entry.name}
                  </a>
                ) : (
                  <span className={cn("font-medium truncate block", entry.status === "error" ? "text-red-700" : "text-gray-700")}>
                    {entry.name}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {entry.status === "uploading" && "Uploading…"}
                  {entry.status === "error" && (entry.error ?? "Upload failed")}
                  {entry.status === "done" && formatSize(entry.size)}
                </span>
              </div>

              {entry.status === "done" && (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
              )}

              {entry.status !== "uploading" && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeEntry(entry); }}
                  className="text-gray-300 hover:text-gray-500 flex-shrink-0 ml-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
