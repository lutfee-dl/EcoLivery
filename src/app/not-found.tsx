"use client";

import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-slate-800/50 p-6">
            <FileQuestion className="h-20 w-20 text-slate-400" />
          </div>
        </div>

        <h1 className="mb-4 text-6xl font-bold text-white">404</h1>
        <h2 className="mb-2 text-2xl font-semibold text-slate-300">ไม่พบหน้าที่คุณต้องการ</h2>
        <p className="mb-8 text-slate-400">
          หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่เคยมีอยู่จริง
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
          >
            <Home className="h-5 w-5" />
            กลับหน้าแรก
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-6 py-3 font-semibold text-white transition hover:bg-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
            ย้อนกลับ
          </button>
        </div>

        <div className="mt-12 text-sm text-slate-500">
          หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อทีมสนับสนุน
        </div>
      </div>
    </div>
  );
}
