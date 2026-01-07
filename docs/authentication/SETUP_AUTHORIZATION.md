# Authorization System - Setup Guide

## Quick Start

Follow these steps to implement the role-based authorization system:

### Step 1: Push Database Schema Changes

Push the schema changes to your database without losing data:

```bash
npx prisma db push
```

This will:
- Add `role` field to User model (default: USER)
- Create UserRole enum (USER, ADMIN)
- Update your database schema without deleting data
- Update Prisma Client

### Step 2: Generate Prisma Client

After pushing, regenerate the Prisma client:

```bash
npx prisma generate
```

### Step 3: Set Admin User

You need to manually assign admin role to at least one user.

**Option A: Using Prisma Studio**
```bash
npx prisma studio
```
- Open the User table
- Find your user
- Change `role` from `USER` to `ADMIN`
- Save

**Option B: Using SQL**
```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'your-admin-email@example.com';
```

**Option C: Using Prisma Client (create script)**

Create `scripts/set-admin.ts`:
```typescript
import { prisma } from '../lib/prisma';

async function setAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Please provide an email: npm run set-admin admin@example.com');
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  });

  console.log(`✅ User ${user.email} is now an ADMIN`);
}

setAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Add to `package.json`:
```json
{
  "scripts": {
    "set-admin": "ts-node scripts/set-admin.ts"
  }
}
```

Run:
```bash
npm run set-admin admin@example.com
```

### Step 4: Test Authorization

1. **Test as Regular User:**
   - Try to access `/admin` → should be denied
   - Try to access `GET /api/admin/analytics` → should return 403

2. **Test as Admin:**
   - Access `/admin` → should see dashboard
   - Access `GET /api/admin/analytics` → should return data

3. **Test Resource Ownership:**
   - User A creates a recipe
   - User B tries to edit it → should be denied
   - Admin tries to view analytics → should work

### Step 5: Update Existing API Routes (Optional but Recommended)

Review and update your API routes to use the new authorization utilities.

**Before:**
```typescript
export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const recipe = await prisma.recipe.findUnique({ where: { id: params.id } });
  
  if (recipe.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // ... update logic
}
```

**After:**
```typescript
import { requireAuth, requireOwnershipOrAdmin } from '@/lib/authorization';

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    await requireAuth();

    const recipe = await prisma.recipe.findUnique({ where: { id: params.id } });
    
    if (!recipe) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await requireOwnershipOrAdmin(recipe.userId);
    
    // ... update logic
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

## Verifying the Installation

### 1. Check Database Schema
```bash
npx prisma studio
```
- Verify `role` field exists in User table
- Check that UserRole enum has USER and ADMIN values

### 2. Check Auth Session
Add this to any page to verify role is in session:

```typescript
'use client';
import { useSession } from 'next-auth/react';

export default function TestPage() {
  const { data: session } = useSession();
  
  console.log('User role:', (session?.user as any)?.role);
  
  return <div>Check console for role</div>;
}
```

### 3. Test Admin API
```bash
# As regular user (should fail)
curl -X GET http://localhost:3000/api/admin/analytics \
  -H "Cookie: your-session-cookie"

# Should return 403 Forbidden

# As admin (should work)
# Same request should return analytics data
```

## Troubleshooting

### Issue: "role does not exist" error

**Solution:** You forgot to push the schema changes.
```bash
npx prisma db push
npx prisma generate
```

### Issue: Role not showing in session

**Solution:** Session is cached. Log out and log back in, or restart the dev server.

### Issue: Cannot access admin page

**Possible causes:**
1. User role is not ADMIN → Check database
2. Session not refreshed → Log out and back in
3. Authorization check failing → Check console for errors

### Issue: TypeScript errors about 'role'

**Solution:** Regenerate Prisma client:
```bash
npx prisma generate
```

Then restart your IDE/editor.

## Security Checklist

After implementation, verify:

- [ ] Migration applied successfully
- [ ] At least one admin user exists
- [ ] Regular users cannot access `/admin` page
- [ ] Regular users cannot access `/api/admin/*` endpoints
- [ ] Users can only edit their own resources
- [ ] Admins can view analytics but not modify user data
- [ ] All API routes have proper authentication
- [ ] Error messages don't expose sensitive information
- [ ] Session includes role information

## Next Steps

1. **Add Admin Nav Link:**
   - Update navigation to show "Admin" link only for admins
   - Use `useSession()` to check role client-side

2. **Implement Activity Logging:**
   - Log admin actions for audit trail
   - Track who accessed what and when

3. **Create More Admin Features:**
   - User management interface
   - Content moderation tools
   - System health monitoring
   - API rate limit management

4. **Add Frontend Guards:**
   - Create `<AdminOnly>` component
   - Protect admin routes with middleware
   - Show/hide features based on role

## File Locations

- **Schema:** `/prisma/schema.prisma`
- **Auth Config:** `/lib/auth.ts`
- **Authorization Utils:** `/lib/authorization.ts`
- **Admin API:** `/app/api/admin/analytics/route.ts`
- **Admin Page:** `/app/(dashboard)/admin/page.tsx`
- **Documentation:** `/docs/AUTHORIZATION.md`

## Support

If you encounter issues:
1. Check the TypeScript errors in your IDE
2. Review the console logs
3. Verify database schema with Prisma Studio
4. Check session data with browser dev tools
5. Refer to `/docs/AUTHORIZATION.md` for detailed patterns

## Summary

You've now implemented:
✅ Role-based authorization system
✅ Admin and User roles
✅ Resource ownership checking
✅ Admin analytics API
✅ Admin dashboard UI
✅ Comprehensive documentation

The system is ready to use! 🎉
