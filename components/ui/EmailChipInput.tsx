"use client";

import { useState, type KeyboardEvent, type ClipboardEvent, type FocusEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  className?: string;
};

function splitEmails(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

// Plain single-line <input> fields don't scroll usefully once a handful of
// addresses are typed in — it just looks like the field stopped accepting
// more. This renders each recipient as its own chip so the list is always
// fully visible and individually editable.
export function EmailChipInput({ value, onChange, placeholder, className }: Props) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const parts = splitEmails(draft);
    if (parts.length === 0) return;
    onChange(Array.from(new Set([...value, ...parts])));
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === ";" || e.key === "Tab") {
      if (draft.trim()) {
        e.preventDefault();
        commitDraft();
      }
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (/[,;\s]/.test(text.trim())) {
      e.preventDefault();
      const parts = splitEmails(text);
      if (parts.length > 0) onChange(Array.from(new Set([...value, ...parts])));
    }
  }

  function handleBlur(_e: FocusEvent<HTMLInputElement>) {
    commitDraft();
  }

  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1.5 min-h-8 cursor-text focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className
      )}
      onClick={(e) => {
        (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.focus();
      }}
    >
      {value.map((email, idx) => (
        <span
          key={`${email}-${idx}`}
          className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px]"
        >
          <span className="max-w-[180px] truncate">{email}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeAt(idx);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent text-xs outline-none placeholder:text-muted-foreground py-0.5"
      />
    </div>
  );
}
