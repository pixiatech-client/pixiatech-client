"use client";

import PixiaEditor from "@/components/pdf/PixiaEditor";

export default function PDFSettingsPage() {
  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto h-screen custom-scrollbar">
      <PixiaEditor />
    </div>
  );
}
