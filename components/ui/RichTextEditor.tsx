"use client";

import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline, List, Link as LinkIcon, Paperclip, RemoveFormatting } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  onAttachFile?: () => void;
}

export interface RichTextEditorRef {
  focus: () => void;
}

export const RichTextEditor = React.forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChange, placeholder = "Write your message...", minHeight = "150px", onAttachFile }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const isUpdatingRef = useRef(false);

    React.useImperativeHandle(ref, () => ({
      focus: () => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      },
    }));

  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);
      isUpdatingRef.current = false;
    }
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      handleInput();
    }
  };

  const handleAddLink = () => {
    const url = prompt("Enter website link URL (e.g. https://ukrba.org):");
    if (url) {
      execCmd("createLink", url);
    }
  };

  return (
    <div className="rounded-md border bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring">
      {/* Visual Formatting Toolbar */}
      <div className="flex items-center gap-1 border-b bg-muted/30 p-1.5 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => execCmd("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => execCmd("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => execCmd("underline")}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-3.5 w-3.5" />
        </Button>
        <div className="h-4 w-[1px] bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => execCmd("insertUnorderedList")}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleAddLink}
          title="Add Web Hyperlink (URL)"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </Button>

        {onAttachFile && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1 font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            onClick={onAttachFile}
            title="Attach Document or Image File"
          >
            <Paperclip className="h-3.5 w-3.5" />
            <span>Attach File</span>
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 ml-auto text-muted-foreground hover:text-foreground"
          onClick={() => execCmd("removeFormat")}
          title="Clear Formatting"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Gmail-style Live WYSIWYG ContentEditable Container */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{ minHeight }}
        data-placeholder={placeholder}
        className="p-3 text-sm leading-relaxed focus:outline-none overflow-y-auto max-h-[300px] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none"
      />
    </div>
  );
});

RichTextEditor.displayName = "RichTextEditor";
