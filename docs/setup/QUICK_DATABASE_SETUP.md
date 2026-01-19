# Quick Database Setup - Supabase

## TL;DR - What to Do

✅ **DO NOT overwrite your database** - Both files are safe to run  
✅ **Run `schema.sql` first** - Creates all tables  
✅ **Run `enhancements.sql` second** - Adds optimizations  
✅ **Your existing data is safe** - Scripts use `IF NOT EXISTS`

## Quick Steps (5 minutes)

### 1. Open Supabase Dashboard
- Go to https://app.supabase.com
- Select your project

### 2. Run schema.sql
1. Click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Open `supabase/schema.sql` from your project
4. Copy ALL contents (Cmd+A, Cmd+C)
5. Paste into SQL Editor
6. Click **"Run"** (or Cmd+Enter)
7. Wait for "Success" message

### 3. Run enhancements.sql
1. Click **"New query"** again
2. Open `supabase/enhancements.sql`
3. Copy ALL contents
4. Paste into SQL Editor
5. Click **"Run"**
6. Wait for "Success" message

### 4. Verify
- Go to **"Table Editor"** → Check tables exist
- Go to **"Database"** → **"Functions"** → Check functions exist

## What Each File Does

| File | What It Creates | Safe? |
|------|----------------|-------|
| `schema.sql` | All tables, basic indexes | ✅ Yes - Uses `IF NOT EXISTS` |
| `enhancements.sql` | Triggers, functions, views, optimizations | ✅ Yes - Uses `CREATE OR REPLACE` |

## Common Questions

**Q: Will this delete my existing data?**  
A: ❌ No! Both files are designed to be safe. They only create what doesn't exist.

**Q: What if I get errors?**  
A: Most errors are harmless (like "table already exists"). If you see real errors, check the error message.

**Q: Do I need to run both files?**  
A: ✅ Yes - `schema.sql` creates tables, `enhancements.sql` adds optimizations.

**Q: Can I run them multiple times?**  
A: ✅ Yes - They're idempotent (safe to run multiple times).

## Troubleshooting

**Error: "extension pgcrypto does not exist"**
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```
Run this first, then run schema.sql again.

**Error: "relation already exists"**
✅ This is OK! It means the table already exists. Your data is safe.

**Error: "permission denied"**
- Make sure you're logged in with admin access
- Check you're in the correct project

## Need More Details?

See [DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md) for complete step-by-step instructions.
