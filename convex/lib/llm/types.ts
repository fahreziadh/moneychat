import { z } from "zod/v3";

export const CATEGORIES = [
  "food",
  "transport",
  "shopping",
  "bills",
  "health",
  "entertainment",
  "education",
  "transfer",
  "other",
] as const;

export const parsedExpenseSchema = z.object({
  amount: z.number().describe("Amount in IDR (no decimals)"),
  category: z.enum(CATEGORIES).describe("Expense category"),
  description: z.string().describe("Cleaned up description in Bahasa Indonesia"),
  groupHint: z.string().nullable().describe("Detected group context, e.g. 'ortu'"),
  date: z.string().describe("ISO date YYYY-MM-DD"),
  confidence: z.number().min(0).max(1).describe("Parsing confidence score"),
});

export type ParsedExpense = z.infer<typeof parsedExpenseSchema>;

export function getSystemPrompt(today: string): string {
  return `You are a financial transaction parser for Indonesian users.
Extract expense information from casual Indonesian chat messages.

Rules:
- amount: number in IDR. Parse "rb"=000, "k"=000, "jt"=000000
- category: one of [food, transport, shopping, bills, health, entertainment, education, transfer, other]
- description: cleaned up description in Bahasa Indonesia
- groupHint: detected group context (e.g. "ortu" from "obat mama"), null if none
- date: ISO date YYYY-MM-DD. Default today ${today}. Parse "kemarin"=yesterday, "tadi"=today, "minggu lalu"=7 days ago
- confidence: 0-1, how confident you are in the parsing

Examples:
Input: "makan siang 35rb"
→ amount=35000, category=food, description="Makan siang", date=${today}, confidence=0.95

Input: "/ortu obat mama 200rb"
→ amount=200000, category=health, description="Obat mama", groupHint="ortu", date=${today}, confidence=0.95

Input: "kemarin grab ke kantor 25k"
→ amount=25000, category=transport, description="Grab ke kantor", date=YESTERDAY, confidence=0.90`;
}
