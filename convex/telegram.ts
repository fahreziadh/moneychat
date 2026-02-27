import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { api } from "./_generated/api";
import { expenseAgent, parsedExpenseSchema } from "./lib/llm";

const TELEGRAM_API = "https://api.telegram.org/bot";

async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string
) {
  await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

type Intent =
  | { type: "rekap"; period: "hari" | "minggu" | "bulan" }
  | { type: "budget"; amount: number }
  | { type: "new_group"; name: string }
  | { type: "delete_last" }
  | { type: "help" }
  | { type: "expense" };

function detectIntent(text: string): Intent {
  const lower = text.toLowerCase().trim();

  if (lower === "help" || lower === "/help" || lower === "/start") {
    return { type: "help" };
  }

  if (lower === "hapus terakhir" || lower === "/hapus") {
    return { type: "delete_last" };
  }

  const rekapMatch = lower.match(/^(?:rekap|\/rekap)(?:\s+(hari|minggu|bulan))?$/);
  if (rekapMatch) {
    return { type: "rekap", period: (rekapMatch[1] as "hari" | "minggu" | "bulan") ?? "bulan" };
  }

  const budgetMatch = lower.match(/^(?:budget|\/budget)\s+(\d+(?:\.\d+)?)(rb|jt|k)?$/);
  if (budgetMatch) {
    let amount = parseFloat(budgetMatch[1]);
    const suffix = budgetMatch[2];
    if (suffix === "rb" || suffix === "k") amount *= 1000;
    if (suffix === "jt") amount *= 1000000;
    return { type: "budget", amount };
  }

  const groupMatch = lower.match(/^(?:grup baru|\/newgroup)\s+(.+)$/);
  if (groupMatch) {
    return { type: "new_group", name: groupMatch[1].trim() };
  }

  return { type: "expense" };
}

function getDateRange(period: "hari" | "minggu" | "bulan"): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().split("T")[0];

  if (period === "hari") {
    return { startDate: endDate, endDate };
  }

  if (period === "minggu") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { startDate: start.toISOString().split("T")[0], endDate };
  }

  // bulan
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  return { startDate, endDate };
}

const HELP_TEXT = `<b>MoneyChat</b> - Catat pengeluaran via chat!

<b>Cara pakai:</b>
Ketik langsung pengeluaranmu, contoh:
- "makan siang 35rb"
- "grab ke kantor 25k"
- "belanja bulanan 500rb"

Atau kirim foto struk/receipt.

<b>Perintah:</b>
- <b>rekap</b> / <b>rekap minggu</b> / <b>rekap bulan</b> — Lihat ringkasan
- <b>budget 5jt</b> — Set budget bulanan
- <b>grup baru [nama]</b> — Buat group baru
- <b>hapus terakhir</b> — Hapus transaksi terakhir
- <b>help</b> — Tampilkan bantuan ini`;

export const handleMessage = internalAction({
  args: {
    telegramId: v.number(),
    chatId: v.number(),
    username: v.optional(v.string()),
    displayName: v.string(),
    text: v.optional(v.string()),
    photoFileId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN!;

    // Upsert user
    const userId = await ctx.runMutation(api.users.upsert, {
      telegramId: args.telegramId,
      username: args.username,
      displayName: args.displayName,
    });

    const user = await ctx.runQuery(api.users.getById, { id: userId });
    if (!user?.defaultGroupId) {
      await sendTelegramMessage(botToken, args.chatId, "Terjadi kesalahan: group default tidak ditemukan.");
      return;
    }

    // Photo → always parse as expense
    if (args.photoFileId) {
      await handleExpense(ctx, args, botToken, userId, user.defaultGroupId);
      return;
    }

    if (!args.text) return;

    const intent = detectIntent(args.text);

    switch (intent.type) {
      case "help":
        await sendTelegramMessage(botToken, args.chatId, HELP_TEXT);
        return;

      case "rekap":
        await handleRekap(ctx, args.chatId, botToken, user.defaultGroupId, intent.period);
        return;

      case "budget":
        await handleBudget(ctx, args.chatId, botToken, user.defaultGroupId, intent.amount);
        return;

      case "new_group":
        await handleNewGroup(ctx, args.chatId, botToken, userId, intent.name);
        return;

      case "delete_last":
        await handleDeleteLast(ctx, args.chatId, botToken, user.defaultGroupId);
        return;

      case "expense":
        await handleExpense(ctx, args, botToken, userId, user.defaultGroupId);
        return;
    }
  },
});

// --- Handlers ---

async function handleRekap(
  ctx: any,
  chatId: number,
  botToken: string,
  groupId: any,
  period: "hari" | "minggu" | "bulan"
) {
  const { startDate, endDate } = getDateRange(period);
  const summary = await ctx.runQuery(api.transactions.summary, {
    groupId,
    startDate,
    endDate,
  });

  if (summary.count === 0) {
    await sendTelegramMessage(botToken, chatId, `Belum ada transaksi periode ${period} ini.`);
    return;
  }

  const periodLabel = period === "hari" ? "Hari Ini" : period === "minggu" ? "Minggu Ini" : "Bulan Ini";
  let text = `<b>Rekap ${periodLabel}</b>\n\n`;
  text += `Total: <b>${formatCurrency(summary.total)}</b> (${summary.count} transaksi)\n\n`;

  const sorted = Object.entries(summary.byCategory).sort(([, a], [, b]) => (b as number) - (a as number));
  for (const [category, amount] of sorted) {
    text += `- ${category}: ${formatCurrency(amount as number)}\n`;
  }

  await sendTelegramMessage(botToken, chatId, text);
}

async function handleBudget(
  ctx: any,
  chatId: number,
  botToken: string,
  groupId: any,
  amount: number
) {
  const now = new Date();
  await ctx.runMutation(api.budgets.set, {
    groupId,
    monthlyAmount: amount,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  await sendTelegramMessage(
    botToken,
    chatId,
    `Budget bulan ini di-set ke <b>${formatCurrency(amount)}</b>`
  );
}

async function handleNewGroup(
  ctx: any,
  chatId: number,
  botToken: string,
  userId: any,
  name: string
) {
  const slug = name.toLowerCase().replace(/\s+/g, "");
  const groupId = await ctx.runMutation(api.groups.create, {
    name,
    slug,
    userId,
  });

  await sendTelegramMessage(
    botToken,
    chatId,
    `Group "<b>${name}</b>" berhasil dibuat! ID: ${groupId}`
  );
}

async function handleDeleteLast(
  ctx: any,
  chatId: number,
  botToken: string,
  groupId: any
) {
  const transactions = await ctx.runQuery(api.transactions.list, {
    groupId,
    limit: 1,
  });

  if (transactions.length === 0) {
    await sendTelegramMessage(botToken, chatId, "Tidak ada transaksi untuk dihapus.");
    return;
  }

  const tx = transactions[0];
  await ctx.runMutation(api.transactions.remove, { id: tx._id });

  await sendTelegramMessage(
    botToken,
    chatId,
    `Transaksi dihapus: ${tx.description} - ${formatCurrency(tx.amount)}`
  );
}

async function handleExpense(
  ctx: any,
  args: {
    chatId: number;
    text?: string;
    photoFileId?: string;
  },
  botToken: string,
  userId: any,
  groupId: any
) {
  const today = new Date().toISOString().split("T")[0];

  try {
    let prompt: string;

    if (args.photoFileId) {
      const fileRes = await fetch(
        `${TELEGRAM_API}${botToken}/getFile?file_id=${args.photoFileId}`
      );
      const fileData = await fileRes.json();
      const filePath = fileData.result.file_path;
      const photoRes = await fetch(
        `https://api.telegram.org/file/bot${botToken}/${filePath}`
      );
      const photoBuffer = await photoRes.arrayBuffer();
      const base64 = btoa(
        String.fromCharCode(...new Uint8Array(photoBuffer))
      );
      prompt = `[Image attached as base64: data:image/jpeg;base64,${base64}]\nParse this receipt/struk and extract the expense information.`;
    } else {
      prompt = args.text!;
    }

    const { threadId } = await expenseAgent.createThread(ctx, {});
    const result = await expenseAgent.generateObject(
      ctx,
      { threadId },
      {
        prompt,
        schema: parsedExpenseSchema,
        system: `You are a financial transaction parser for Indonesian users.
Extract expense information from casual Indonesian chat messages.

Rules:
- amount: number in IDR. Parse "rb"=000, "k"=000, "jt"=000000
- category: one of [food, transport, shopping, bills, health, entertainment, education, transfer, other]
- description: cleaned up description in Bahasa Indonesia
- groupHint: detected group context (e.g. "ortu" from "obat mama"), null if none
- date: ISO date YYYY-MM-DD. Default today ${today}. Parse "kemarin"=yesterday, "tadi"=today, "minggu lalu"=7 days ago
- confidence: 0-1, how confident you are in the parsing`,
      }
    );

    const parsed = result.object;

    if (parsed.confidence < 0.7) {
      await sendTelegramMessage(
        botToken,
        args.chatId,
        `Maaf, saya kurang yakin. Bisa perjelas?\n\nYang saya tangkap:\n- ${parsed.description}: ${formatCurrency(parsed.amount)} (${parsed.category})\n- Confidence: ${Math.round(parsed.confidence * 100)}%`
      );
      return;
    }

    await ctx.runMutation(api.transactions.create, {
      userId,
      groupId,
      amount: parsed.amount,
      category: parsed.category,
      description: parsed.description,
      date: parsed.date,
      rawMessage: args.text ?? "[photo]",
      llmConfidence: parsed.confidence,
    });

    // Check budget
    const [year, month] = parsed.date.split("-").map(Number);
    const budget = await ctx.runQuery(api.budgets.get, {
      groupId,
      month,
      year,
    });

    let budgetInfo = "";
    if (budget) {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
      const summary = await ctx.runQuery(api.transactions.summary, {
        groupId,
        startDate,
        endDate,
      });
      const remaining = budget.monthlyAmount - summary.total;
      budgetInfo = `\n💰 Sisa budget: ${formatCurrency(remaining)}`;
    }

    await sendTelegramMessage(
      botToken,
      args.chatId,
      `✅ ${parsed.description} - ${formatCurrency(parsed.amount)} (${parsed.category})${budgetInfo}`
    );
  } catch (e) {
    console.error("Error handling message:", e);
    await sendTelegramMessage(
      botToken,
      args.chatId,
      "Maaf, terjadi kesalahan saat memproses pesan. Coba lagi ya."
    );
  }
}
