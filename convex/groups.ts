import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    icon: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      slug: args.slug,
      icon: args.icon ?? "🏠",
      createdBy: args.userId,
    });

    await ctx.db.insert("groupMembers", {
      userId: args.userId,
      groupId,
      role: "admin",
    });

    return groupId;
  },
});

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const groups = await Promise.all(
      memberships.map((m) => ctx.db.get(m.groupId))
    );

    return groups.filter(Boolean);
  },
});

export const getMembers = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return user ? { ...user, role: m.role } : null;
      })
    );

    return members.filter(Boolean);
  },
});

export const invite = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_user_group", (q) =>
        q.eq("userId", args.userId).eq("groupId", args.groupId)
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("groupMembers", {
      userId: args.userId,
      groupId: args.groupId,
      role: "member",
    });
  },
});
