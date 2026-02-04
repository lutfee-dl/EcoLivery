export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-semibold">
            EL
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">EcoLivery</p>
            <h1 className="text-xl font-semibold">ระบบตู้ล็อคเกอร์เช่าอัจฉริยะ</h1>
          </div>
        </div>
        <button className="rounded-full border border-emerald-400 px-5 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/10">
          ขอเดโมระบบ
        </button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-20">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              เชื่อม Firebase พร้อมรองรับหลายบทบาท
            </p>
            <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
              ฝากของให้ไรเดอร์อย่างลื่นไหล ปลอดภัย และตรวจสอบได้ทุกขั้นตอน
            </h2>
            <p className="text-lg text-slate-300">
              ออกแบบมาเพื่อประสบการณ์ไร้รอยต่อ ตั้งแต่ชำระเงิน สร้าง QR ให้ไรเดอร์เปิดตู้
              ไปจนถึงแจ้งลูกค้าเพื่อรับของด้วย OTP เพียงครั้งเดียว
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300">
                เริ่มออกแบบระบบ
              </button>
              <button className="rounded-full border border-slate-600 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-slate-400">
                ดูรายละเอียดโฟลว์
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "ใช้งานง่าย",
                  desc: "ผู้ใช้กดฝากในแอปครั้งเดียว ระบบทำงานต่ออัตโนมัติ",
                },
                {
                  title: "ปลอดภัย",
                  desc: "บันทึกภาพ, OTP และประวัติการใช้งานทุกครั้ง",
                },
                {
                  title: "รายได้ทันที",
                  desc: "คอมมิชชั่นเข้า Wallet ไรเดอร์ทันทีเมื่อปิดตู้",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <h3 className="text-base font-semibold text-emerald-200">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6 shadow-xl shadow-emerald-500/10">
            <h3 className="text-lg font-semibold">บทบาทการเข้าใช้งาน</h3>
            <div className="mt-4 space-y-4">
              {[
                {
                  role: "ผู้ใช้",
                  method: "Google Login หรือ LINE Login",
                  note: "สะดวก เริ่มใช้งานทันที",
                },
                {
                  role: "ไรเดอร์",
                  method: "Phone Number + OTP",
                  note: "ยืนยันตัวตนได้จริง ติดต่อรับ-ส่งง่าย",
                },
                {
                  role: "แอดมิน",
                  method: "Email / Password",
                  note: "จัดการตู้และธุรกรรมแบบมืออาชีพ",
                },
              ].map((item) => (
                <div key={item.role} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-white">{item.role}</p>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                      Firebase Auth
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{item.method}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Workflow</p>
              <h3 className="mt-2 text-2xl font-semibold">ขั้นตอนการใช้งานแบบไร้รอยต่อ</h3>
            </div>
            <div className="hidden items-center gap-2 text-sm text-slate-400 md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              ติดตามสถานะได้แบบเรียลไทม์
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {[
              {
                step: "1",
                title: "ลูกค้าแจ้งฝาก",
                desc: "เลือกตู้ ชำระเงินผ่าน Payment Gateway และรับ QR หรือ Link เพื่อส่งให้ไรเดอร์",
                highlight: "ระบบตัดเงินอัตโนมัติ",
              },
              {
                step: "2",
                title: "ไรเดอร์นำของมาส่ง",
                desc: "สแกน QR เปิดตู้ ใส่พัสดุ ถ่ายรูปยืนยันก่อนปิด เพื่อความปลอดภัย",
                highlight: "คอมมิชชั่นเข้า Wallet ทันที",
              },
              {
                step: "3",
                title: "ลูกค้ามารับของ",
                desc: "ระบบแจ้งเตือนพร้อม OTP เปิดตู้ครั้งเดียว หรือกดเปิดผ่านมือถือ",
                highlight: "ปิดงานอัตโนมัติ",
              },
            ].map((item) => (
              <div key={item.step} className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-emerald-500/20" />
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-base font-semibold text-slate-900">
                    {item.step}
                  </span>
                  <h4 className="text-lg font-semibold">{item.title}</h4>
                </div>
                <p className="mt-4 text-sm text-slate-300">{item.desc}</p>
                <p className="mt-4 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                  {item.highlight}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="text-xl font-semibold">จุดเด่นความปลอดภัย</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                รูปภาพหลักฐานถูกบังคับให้ถ่ายก่อนปิดตู้
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                OTP ใช้ได้ครั้งเดียว ลดความเสี่ยงจากการแชร์รหัส
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                บันทึกสถานะแบบเรียลไทม์ใน Firebase
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-slate-950 p-6">
            <h3 className="text-xl font-semibold">พร้อมเชื่อมต่อ Firebase</h3>
            <p className="mt-3 text-sm text-slate-300">
              รองรับ Authentication หลายรูปแบบ พร้อมจัดเก็บข้อมูลตู้, ธุรกรรม, รูปภาพ
              และ Wallet ไว้ใน Firestore อย่างปลอดภัย
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                "Auth: Google, LINE, Phone, Email",
                "Firestore: Locker & Orders",
                "Storage: รูปหลักฐาน",
                "Functions: แจ้งเตือน/OTP",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}