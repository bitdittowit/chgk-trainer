import { useEffect, useState } from "react";

export function Toast({ message, open, onClose }: { message: string; open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (open) {
      const t = setTimeout(onClose, 3000);
      return () => clearTimeout(t);
    }
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded shadow-lg z-50">
      {message}
    </div>
  );
} 