import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string | { toString(): string } | null | undefined,
  currency = "USD",
) {
  if (amount === null || amount === undefined) return "—";
  const value = typeof amount === "number" ? amount : Number(amount.toString());
  return new Intl.NumberFormat("es-PA", { style: "currency", currency }).format(value);
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-PA", { dateStyle: "medium" }).format(d);
}
