import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace("IDR", "Rp").trim();
}

export function formatRupiahCompact(amount: number): string {
  if (amount >= 1000000) {
    const jt = amount / 1000000;
    return `Rp ${jt.toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  }
  if (amount >= 1000) {
    const rb = amount / 1000;
    return `Rp ${rb.toLocaleString("id-ID", { maximumFractionDigits: 1 })} rb`;
  }
  return `Rp ${amount}`;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

export function getMonthName(monthNumber: number): string {
  // Supports 1-indexed (1=Jan) and 0-indexed (0=Jan)
  const index = monthNumber > 12 ? (monthNumber % 12) : monthNumber;
  return MONTH_NAMES[(index - 1 + 12) % 12] || "";
}

export function getMonthNameFromDate(date: string | Date): string {
  const d = new Date(date);
  return MONTH_NAMES[d.getMonth()];
}
