"use client";

import { useEffect, useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";

interface DocumentViewerProps {
  documentId: string;
  initialContent: string;
  editable?: boolean;
  onSave?: (markdown: string) => Promise<void>;
}

export function DocumentViewer({
  initialContent,
  editable = false,
  onSave,
}: DocumentViewerProps) {
  const editor = useCreateBlockNote();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function load() {
      if (!initialContent) {
        setIsReady(true);
        return;
      }
      try {
        const blocks = await editor.tryParseMarkdownToBlocks(initialContent);
        editor.replaceBlocks(editor.document, blocks);
      } catch (e) {
        console.error("Failed to parse markdown:", e);
      }
      setIsReady(true);
    }
    load();
  }, [initialContent, editor]);

  if (!isReady) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading document...
      </div>
    );
  }

  return (
    <BlockNoteView editor={editor} editable={editable} theme="light" />
  );
}