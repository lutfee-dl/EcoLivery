"use client";

import { useState } from "react";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Scanner UI */}
        <div className="rounded-3xl border-2 border-emerald-500/30 bg-slate-900 p-6">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <Camera className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="mt-4 text-2xl font-bold">สแกน QR Code</h3>
            <p className="mt-2 text-sm text-slate-400">
              สแกน QR Code จากลูกค้า หรือกรอก Token ด้วยตนเอง
            </p>
          </div>

          {/* Manual Input */}
          <div className="mt-6 space-y-3">
            <label className="block text-sm font-semibold text-slate-300">
              หรือกรอก Token ด้วยตนเอง
            </label>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="กรอก Token..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
              className="w-full rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-900 transition hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยืนยัน Token
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
