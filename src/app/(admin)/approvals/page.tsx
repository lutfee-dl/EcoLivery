"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const statusLabel: Record<string, string> = {
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
};

type RiderRecord = {
  id: string;
  fullName: string;
  nationalId: string;
  vehicleType: string;
  licensePlate: string;
  phone: string;
  status: "pending" | "approved" | "rejected";
};

export default function RiderApprovalsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riders, setRiders] = useState<RiderRecord[]>([]);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const riderQuery = query(collection(db, "riders"), where("status", "==", "pending"));
      const snapshot = await getDocs(riderQuery);
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<RiderRecord, "id">),
      }));
      setRiders(items);
    } catch (err: any) {
      setError(err?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleDecision = async (id: string, status: "approved" | "rejected") => {
    setLoading(true);
    setError(null);
    try {
      const adminUser = auth.currentUser;
      if (!adminUser) {
        setError("กรุณาเข้าสู่ระบบแอดมินก่อน");
        return;
      }

      const riderRef = doc(db, "riders", id);
      await updateDoc(riderRef, {
        status,
        approved: status === "approved",
        approvedBy: adminUser.uid,
        approvedAt: new Date(),
      });

      setRiders((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err?.message || "อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">รายการรออนุมัติ</h2>
          <p className="mt-2 text-sm text-slate-300">ตรวจสอบข้อมูลก่อนอนุมัติ/ปฏิเสธ</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPending}
            className="rounded-full border border-emerald-400 px-5 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/10"
          >
            รีเฟรช
          </button>
          <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200">
            {riders.length} รายการ
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
          กำลังโหลดข้อมูล...
        </div>
      )}

      {!loading && riders.length === 0 && (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-6 text-center text-sm text-slate-400">
          ยังไม่มีรายการรออนุมัติ
        </div>
      )}

      <div className="mt-6 grid gap-4">
        {riders.map((rider) => (
          <div key={rider.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{rider.fullName}</h3>
                <p className="mt-1 text-xs text-slate-400">
                  สถานะ: {statusLabel[rider.status] || rider.status}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDecision(rider.id, "approved")}
                  className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-emerald-300"
                >
                  อนุมัติ
                </button>
                <button
                  onClick={() => handleDecision(rider.id, "rejected")}
                  className="rounded-full border border-rose-500 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/10"
                >
                  ปฏิเสธ
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
              <p>เบอร์โทร: {rider.phone}</p>
              <p>เลขบัตร: {rider.nationalId}</p>
              <p>พาหนะ: {rider.vehicleType}</p>
              <p>ทะเบียน: {rider.licensePlate}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
        หมายเหตุ: แนะนำให้กำหนด Custom Claims สำหรับแอดมินใน Firebase เพื่อป้องกันผู้ใช้ทั่วไปเข้าถึงหน้านี้
      </section>
    </section>
  );
}
