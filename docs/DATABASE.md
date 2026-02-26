# Database Schema (Convex)

Convex menggunakan document-based database. Setiap document otomatis punya `_id` (unique ID) dan `_creationTime` (timestamp). Schema didefinisikan di `convex/schema.ts`.

---

## ERD

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     users        │     │  groupMembers    │     │     groups       │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ _id              │────<│ userId           │>────│ _id              │
│ telegramId       │     │ groupId          │     │ name             │
│ username?        │     │ role             │     │ slug             │
│ displayName      │     │                  │     │ icon             │
│ defaultGroupId?  │     │                  │     │ createdBy        │
│ _creationTime    │     │ _creationTime    │     │ _creationTime    │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
        │                                                   │
        │              ┌──────────────────┐                 │
        │              │  transactions    │                 │
        │              ├──────────────────┤                 │
        └─────────────>│ _id             │<────────────────┘
                       │ userId           │
                       │ groupId          │
                       │ amount           │
                       │ category         │
                       │ description      │
                       │ date             │
                       │ rawMessage       │
                       │ llmConfidence?   │
                       │ _creationTime    │
                       └──────────────────┘

                       ┌──────────────────┐
                       │    budgets       │
                       ├──────────────────┤
                       │ _id              │
                       │ groupId          │
                       │ monthlyAmount    │
                       │ month            │
                       │ year             │
                       │ _creationTime    │
                       └──────────────────┘

                       ┌──────────────────┐
                       │    sessions      │
                       ├──────────────────┤
                       │ _id              │
                       │ userId           │
                       │ token            │
                       │ expiresAt        │
                       │ _creationTime    │
                       └──────────────────┘
```

---

## Tables

### users
| Field | Type | Notes |
|-------|------|-------|
| _id | Id\<"users"\> | Auto-generated |
| telegramId | number | Telegram user ID, unique via index |
| username | string? | Telegram @username, optional |
| displayName | string | Telegram display name |
| defaultGroupId | Id\<"groups"\>? | User's default logging group |
| _creationTime | number | Auto-generated timestamp |

**Indexes:**
- `by_telegram_id` → `["telegramId"]`

### groups
| Field | Type | Notes |
|-------|------|-------|
| _id | Id\<"groups"\> | Auto-generated |
| name | string | "Rumah Tangga", "Ortu", etc |
| slug | string | URL & command friendly: "rumahtangga", "ortu" |
| icon | string | Emoji icon, default "🏠" |
| createdBy | Id\<"users"\> | Group creator reference |
| _creationTime | number | Auto-generated timestamp |

**Indexes:**
- `by_slug` → `["slug"]`
- `by_created_by` → `["createdBy"]`

### groupMembers
| Field | Type | Notes |
|-------|------|-------|
| _id | Id\<"groupMembers"\> | Auto-generated |
| userId | Id\<"users"\> | Member reference |
| groupId | Id\<"groups"\> | Group reference |
| role | "admin" \| "member" | Member role in group |
| _creationTime | number | Auto-generated timestamp |

**Indexes:**
- `by_user` → `["userId"]`
- `by_group` → `["groupId"]`
- `by_user_group` → `["userId", "groupId"]` (untuk uniqueness check)

### transactions
| Field | Type | Notes |
|-------|------|-------|
| _id | Id\<"transactions"\> | Auto-generated |
| userId | Id\<"users"\> | Who logged it |
| groupId | Id\<"groups"\> | Which group |
| amount | number | Amount in IDR (no decimals) |
| category | string | food, transport, shopping, etc |
| description | string | Cleaned description from LLM |
| date | string | ISO date "YYYY-MM-DD" |
| rawMessage | string | Original chat message |
| llmConfidence | number? | 0-1 confidence score |
| _creationTime | number | Auto-generated timestamp |

**Indexes:**
- `by_user_date` → `["userId", "date"]`
- `by_group_date` → `["groupId", "date"]`
- `by_category` → `["category"]`

### budgets
| Field | Type | Notes |
|-------|------|-------|
| _id | Id\<"budgets"\> | Auto-generated |
| groupId | Id\<"groups"\> | Group reference |
| monthlyAmount | number | Budget in IDR |
| month | number | 1-12 |
| year | number | e.g. 2026 |
| _creationTime | number | Auto-generated timestamp |

**Indexes:**
- `by_group_month_year` → `["groupId", "year", "month"]`

### sessions
| Field | Type | Notes |
|-------|------|-------|
| _id | Id\<"sessions"\> | Auto-generated |
| userId | Id\<"users"\> | User reference |
| token | string | Session token string |
| expiresAt | number | Expiry timestamp (ms) |
| _creationTime | number | Auto-generated timestamp |

**Indexes:**
- `by_token` → `["token"]`
- `by_user` → `["userId"]`

---

## Initial Data (On First User Message)

When a user sends their first message to the Telegram bot:
1. Convex upserts `users` record from Telegram data
2. Creates default group "Personal" with user as admin
3. Adds `groupMembers` record (userId + groupId, role: "admin")
4. Sets "Personal" as `defaultGroupId`
5. Bot prompts user to create additional family groups

---

## Notes

- **No SQL, no migrations** — Convex handles schema changes automatically. Edit `convex/schema.ts` and push.
- **Realtime by default** — Any query subscribed via `useQuery()` in the frontend auto-updates when data changes.
- **References, not JOINs** — Use `Id<"tableName">` for references. Resolve manually in queries (no automatic joins).
- **All amounts in IDR** — Stored as integer (number), no decimals. Rp 35.000 = `35000`.
- **Dates as strings** — Stored as ISO date strings "YYYY-MM-DD" for easy filtering and display.
