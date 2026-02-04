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
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
