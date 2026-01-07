# Quick Setup Commands

## Step 1: Push Schema to Database (Won't Delete Data!)

```bash
npx prisma db push
```

This command:
- ✅ Adds the `role` field to User table
- ✅ Creates UserRole enum (USER, ADMIN)
- ✅ **Preserves all your existing data**
- ✅ No migration files created
- ✅ Perfect for development

## Step 2: Regenerate Prisma Client

```bash
npx prisma generate
```

This updates the TypeScript types so you can use the new `role` field.

## Step 3: Set Admin User

**Option A: Using Prisma Studio (Easiest)**
```bash
npx prisma studio
```
- Open in browser (usually http://localhost:5555)
- Go to User table
- Find your user
- Change `role` from `USER` to `ADMIN`
- Click Save

**Option B: Using SQL**
```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'your-admin-email@example.com';
```

You can run this in Prisma Studio's query console or any PostgreSQL client.

## Step 4: Restart Your Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Step 5: Test It!

1. **Log in as admin user**
2. **Navigate to:** `http://localhost:3000/admin`
3. **You should see:** The admin dashboard with analytics

## Verification

Check that everything works:

```bash
# Check database schema
npx prisma studio

# Check for TypeScript errors
npm run build
```

## If Something Goes Wrong

**TypeScript errors about 'role'?**
```bash
npx prisma generate
# Then restart your IDE/editor
```

**Can't access /admin page?**
1. Check database - is user's role set to ADMIN?
2. Log out and log back in (to refresh session)
3. Check browser console for errors

**"role does not exist" database error?**
```bash
# Push schema again
npx prisma db push
npx prisma generate
```

## What's Different from `migrate dev`?

| Command | Data Preserved | Migration Files | Use Case |
|---------|----------------|-----------------|----------|
| `prisma db push` | ✅ Yes | ❌ No | Development, prototyping |
| `prisma migrate dev` | ❌ No (resets) | ✅ Yes | Production, version control |

For development with test data, **use `db push`**!

## Next Steps

After setup:
1. ✅ You can access `/admin` dashboard
2. ✅ Authorization functions are ready to use
3. ✅ Update existing API routes (optional)
4. ✅ Add admin link to navigation (optional)

See `/docs/AUTHORIZATION_SUMMARY.md` for complete documentation.
