import { v } from "convex/values";
import { query } from "./_generated/server";

export const getByUserAndGroup = query({
  args: {
    userId: v.id("users"),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groupMembers")
      .withIndex("by_user_group", (q) =>
        q.eq("userId", args.userId).eq("groupId", args.groupId)
      )
      .unique();
  },
});

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const listByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});
