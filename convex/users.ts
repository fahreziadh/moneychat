import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getByTelegramId = query({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const upsert = mutation({
  args: {
    telegramId: v.number(),
    username: v.optional(v.string()),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        username: args.username,
        displayName: args.displayName,
      });
      return existing._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      telegramId: args.telegramId,
      username: args.username,
      displayName: args.displayName,
    });

    // Create default "Personal" group
    const groupId = await ctx.db.insert("groups", {
      name: "Personal",
      slug: "personal",
      icon: "👤",
      createdBy: userId,
    });

    // Add user as admin of the group
    await ctx.db.insert("groupMembers", {
      userId,
      groupId,
      role: "admin",
    });

    // Set as default group
    await ctx.db.patch(userId, { defaultGroupId: groupId });

    return userId;
  },
});

export const setDefaultGroup = mutation({
  args: {
    userId: v.id("users"),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { defaultGroupId: args.groupId });
  },
});
