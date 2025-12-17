# Authorization & Access Control System

## Overview
This document outlines the authorization system implemented in the Wellness Hub application, including user roles, resource ownership, and admin access patterns.

## User Roles

### USER (Default)
- Standard user account
- Can create and manage their own content
- Cannot access other users' private resources
- Cannot access admin features

### ADMIN
- Full administrative access
- Can view platform-wide analytics
- **Cannot** access individual user profiles or private resources
- **Cannot** modify user data
- Can access centralized statistics and monitoring

## Database Schema

### User Model - Role Field
```prisma
model User {
  // ... other fields
  role  UserRole  @default(USER)
}

enum UserRole {
  USER
  ADMIN
}
```

## Authorization Utilities

Located in `/lib/authorization.ts`

### Core Functions

#### `getAuthenticatedUser()`
Returns the current authenticated user with role information, or null if not authenticated.

```typescript
const session = await getAuthenticatedUser();
if (!session) {
  // User not logged in
}
```

#### `requireAuth()`
Ensures user is authenticated. Throws error if not.

```typescript
try {
  const session = await requireAuth();
  // User is authenticated
} catch (error) {
  // Return 401 Unauthorized
}
```

#### `requireAdmin()`
Ensures user is an admin. Throws error if not.

```typescript
try {
  await requireAdmin();
  // User is admin
} catch (error) {
  // Return 403 Forbidden
}
```

#### `requireOwnershipOrAdmin(resourceUserId)`
Ensures user owns the resource OR is an admin.

```typescript
try {
  await requireOwnershipOrAdmin(recipe.userId);
  // User can access this resource
} catch (error) {
  // Return 403 Forbidden
}
```

#### `canAccessResource(resourceUserId)`
Checks if user can access a resource (returns boolean).

```typescript
const canAccess = await canAccessResource(recipe.userId);
if (!canAccess) {
  // User cannot access
}
```

## Implementation Examples

### API Route Pattern (Standard Resource)

```typescript
// GET /api/recipes/[id]/route.ts
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Get recipe
    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id }
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Public recipes can be viewed by anyone
    // Private recipes require ownership
    if (recipe.isPrivate) {
      const session = await getAuthenticatedUser();
      const canAccess = await canAccessResource(recipe.userId);
      
      if (!canAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(recipe);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

### API Route Pattern (Update/Delete)

```typescript
// PUT /api/recipes/[id]/route.ts
export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Get recipe
    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id }
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Check ownership (admin can also edit)
    await requireOwnershipOrAdmin(recipe.userId);

    // Update recipe
    const body = await request.json();
    const updated = await prisma.recipe.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(updated);
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

### Admin-Only API Route

```typescript
// GET /api/admin/analytics/route.ts
export async function GET(request: NextRequest) {
  try {
    // Require admin access
    await requireAdmin();

    // Fetch analytics
    const analytics = await getAnalytics();

    return NextResponse.json(analytics);
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

## Admin Analytics Features

### Available Admin Endpoints

#### GET /api/admin/analytics
Returns platform-wide statistics:
- User metrics (total, active, new users)
- Content metrics (recipes, meal plans, shopping lists)
- API usage metrics (AI questions, recipe generations)
- Subscription distribution
- Recent activity

#### GET /api/admin/users (Future)
- User list with basic info
- Cannot access detailed profile data
- Cannot modify user data

## Migration Steps

To apply the role-based authorization system:

### 1. Run Database Migration
```bash
npx prisma migrate dev --name add_user_role
```

### 2. Set Admin User
After migration, manually set an admin user in the database:

```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'admin@yourdomain.com';
```

Or use Prisma Studio:
```bash
npx prisma studio
```

### 3. Update Existing API Routes
Review and update API routes to use new authorization functions:
- Replace manual ownership checks with `requireOwnershipOrAdmin()`
- Add `requireAuth()` to protected endpoints
- Use `requireAdmin()` for admin-only endpoints

## Security Considerations

### ✅ What Admins CAN Do
- View platform-wide analytics
- See aggregated user statistics
- Monitor API usage and system health
- Access centralized dashboards
- View recent activity summaries

### ❌ What Admins CANNOT Do
- Access individual user profiles without consent
- Read users' private recipes or meal plans
- Modify user data
- Impersonate users
- Access personal health information

### Resource Ownership Rules
1. **Public Resources**: Anyone can view
2. **Private Resources**: Only owner (and admins for analytics) can access
3. **User-Generated Content**: Only creator can edit/delete
4. **Admin Access**: Admins can view analytics but not modify user content

## Testing Authorization

### Test Scenarios

1. **Unauthenticated Access**
   - ❌ Cannot access protected endpoints
   - ✅ Can view public content

2. **Regular User Access**
   - ✅ Can access own resources
   - ❌ Cannot access other users' private resources
   - ❌ Cannot access admin endpoints

3. **Admin Access**
   - ✅ Can access admin endpoints
   - ✅ Can view analytics
   - ✅ Can access own resources
   - ❌ Cannot modify other users' resources

## Future Enhancements

### Planned Features
- [ ] Role-based UI components (show/hide admin nav)
- [ ] Detailed API rate limiting by role
- [ ] Admin dashboard UI
- [ ] Activity logging for admin actions
- [ ] User role management interface
- [ ] Content moderation tools
- [ ] System health monitoring

### Additional Roles (Future)
- **MODERATOR**: Content moderation without full admin access
- **PREMIUM_SUPPORT**: Customer support with limited user data access

## Error Handling

Standard HTTP status codes:
- **401 Unauthorized**: User not logged in
- **403 Forbidden**: User logged in but lacks permission
- **404 Not Found**: Resource doesn't exist
- **500 Server Error**: Unexpected error

## Best Practices

1. **Always check authentication first**
2. **Use ownership checks for user resources**
3. **Log admin actions for audit trails**
4. **Never expose sensitive data in responses**
5. **Use TypeScript for type safety**
6. **Handle errors gracefully with clear messages**
7. **Test authorization logic thoroughly**

## Questions?

Refer to:
- `/lib/authorization.ts` - Authorization utilities
- `/lib/auth.ts` - Authentication configuration
- `/app/api/admin/analytics/route.ts` - Admin endpoint example
