import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    telegramId: v.number(),
    username: v.optional(v.string()),
    displayName: v.string(),
    defaultGroupId: v.optional(v.id("groups")),
  })
    .index("by_telegram_id", ["telegramId"]),

  groups: defineTable({
    name: v.string(),
    slug: v.string(),
    icon: v.string(),
    createdBy: v.id("users"),
  })
    .index("by_slug", ["slug"])
    .index("by_created_by", ["createdBy"]),

  groupMembers: defineTable({
    userId: v.id("users"),
    groupId: v.id("groups"),
    role: v.union(v.literal("admin"), v.literal("member")),
  })
    .index("by_user", ["userId"])
    .index("by_group", ["groupId"])
    .index("by_user_group", ["userId", "groupId"]),

  transactions: defineTable({
    userId: v.id("users"),
    groupId: v.id("groups"),
    amount: v.number(),
    category: v.string(),
    description: v.string(),
    date: v.string(), // ISO date string "YYYY-MM-DD"
    rawMessage: v.string(),
    llmConfidence: v.optional(v.number()),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_group_date", ["groupId", "date"])
    .index("by_category", ["category"]),

  budgets: defineTable({
    groupId: v.id("groups"),
    monthlyAmount: v.number(),
    month: v.number(), // 1-12
    year: v.number(),
  })
    .index("by_group_month_year", ["groupId", "year", "month"]),

  // Session tokens for web dashboard auth
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(), // timestamp
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),
});
