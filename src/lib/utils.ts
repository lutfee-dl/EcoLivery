export function formatDate(date: Date | any): string {
  if (!date) return "";
  
  const dateObj = date?.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPrice(price: number): string {
  return `฿${price.toLocaleString("th-TH")}`;
}

export function generateToken(): string {
  // สร้าง Token 6 หลัก ที่จำง่าย (ตัวเลขและตัวอักษรพิมพ์ใหญ่)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ไม่มี I, O, 0, 1 เพื่อไม่ให้สับสน
  let token = "";
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
