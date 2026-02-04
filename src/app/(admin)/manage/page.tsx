import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <section className="grid gap-6 md:grid-cols-3">
      {[{
        title: "ไรเดอร์รออนุมัติ",
        desc: "ตรวจสอบและอนุมัติไรเดอร์ใหม่",
        href: "/admin/approvals",
        action: "ไปหน้าอนุมัติ",
      }, {
        title: "รายการฝากวันนี้",
        desc: "ดูรายการฝาก/รับของล่าสุด",
        href: "/request",
        action: "ดูรายการ",
      }, {
        title: "ตั้งค่าตู้ล็อคเกอร์",
        desc: "เพิ่ม/แก้ไขข้อมูลตู้",
        href: "/",
        action: "จัดการตู้",
      }].map((item) => (
        <div key={item.title} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold">{item.title}</h2>
          <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
          <Link
            href={item.href}
            className="mt-4 inline-flex rounded-full border border-emerald-400 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/10"
          >
            {item.action}
          </Link>
        </div>
      ))}
    </section>
  );
}
