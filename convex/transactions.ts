import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    groupId: v.id("groups"),
    amount: v.number(),
    category: v.string(),
    description: v.string(),
    date: v.string(),
    rawMessage: v.string(),
    llmConfidence: v.optional(v.number()),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transactions", args);
  },
});

export const list = query({
  args: {
    groupId: v.id("groups"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("transactions")
      .withIndex("by_group_date", (q) => q.eq("groupId", args.groupId))
      .order("desc");

    if (args.limit) {
      return await q.take(args.limit);
    }
    return await q.collect();
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const summary = query({
  args: {
    groupId: v.id("groups"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_group_date", (q) =>
        q
          .eq("groupId", args.groupId)
          .gte("date", args.startDate)
          .lte("date", args.endDate)
      )
      .collect();

    const byCategory: Record<string, number> = {};
    let total = 0;

    for (const tx of transactions) {
      byCategory[tx.category] = (byCategory[tx.category] ?? 0) + tx.amount;
      total += tx.amount;
    }

    return { total, byCategory, count: transactions.length };
  },
});
