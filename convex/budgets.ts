import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const set = mutation({
  args: {
    groupId: v.id("groups"),
    monthlyAmount: v.number(),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_group_month_year", (q) =>
        q
          .eq("groupId", args.groupId)
          .eq("year", args.year)
          .eq("month", args.month)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        monthlyAmount: args.monthlyAmount,
      });
      return existing._id;
    }

    return await ctx.db.insert("budgets", args);
  },
});

export const get = query({
  args: {
    groupId: v.id("groups"),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("budgets")
      .withIndex("by_group_month_year", (q) =>
        q
          .eq("groupId", args.groupId)
          .eq("year", args.year)
          .eq("month", args.month)
      )
      .unique();
  },
});
