import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-slate-950/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-sm text-slate-400 md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">EcoLivery</p>
          <p className="mt-1 text-sm text-slate-300">Smart Locker Delivery Platform</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/" className="transition hover:text-slate-200">
            หน้าแรก
          </Link>
          <Link href="/login" className="transition hover:text-slate-200">
            เข้าสู่ระบบ
          </Link>
          <Link href="/request" className="transition hover:text-slate-200">
            แจ้งฝากของ
          </Link>
          <Link href="/admin/approvals" className="transition hover:text-slate-200">
            อนุมัติไรเดอร์
          </Link>
        </div>
      </div>
    </footer>
  );
}
