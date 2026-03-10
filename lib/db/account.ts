import { and, eq, inArray } from 'drizzle-orm';
import type { User } from '@supabase/supabase-js';
import { db } from '@/lib/db/client';
import { creatorProfiles, userRoles, users } from '@/lib/db/schema';

export type PlatformRole = 'student' | 'creator' | 'reviewer' | 'admin';

async function ensureUserRole(userId: string, role: PlatformRole, grantedByUserId?: string) {
    const existing = await db.query.userRoles.findFirst({
        where: (table, { and, eq: tableEq }) => and(tableEq(table.userId, userId), tableEq(table.role, role)),
    });

    if (existing) {
        return existing;
    }

    const inserted = await db
        .insert(userRoles)
        .values({
            userId,
            role,
            grantedByUserId: grantedByUserId || null,
        })
        .returning();

    return inserted[0];
}

export async function ensurePlatformUser(user: User) {
    const existing = await db.query.users.findFirst({
        where: eq(users.id, user.id),
    });

    if (existing) {
        await ensureUserRole(user.id, 'student');
        return existing;
    }

    const inserted = await db
        .insert(users)
        .values({
            id: user.id,
            email: user.email || `${user.id}@placeholder.local`,
            fullName: user.user_metadata.full_name || user.email || 'Usuario Cognira',
            avatarUrl: user.user_metadata.avatar_url || null,
        })
        .returning();

    await ensureUserRole(user.id, 'student');
    return inserted[0];
}

export async function ensureCreatorProfile(user: User) {
    await ensurePlatformUser(user);

    const existing = await db.query.creatorProfiles.findFirst({
        where: eq(creatorProfiles.userId, user.id),
    });

    if (existing) {
        await ensureUserRole(user.id, 'creator');
        return existing;
    }

    const inserted = await db
        .insert(creatorProfiles)
        .values({
            userId: user.id,
            displayName: user.user_metadata.full_name || user.email?.split('@')[0] || 'Criador Cognira',
        })
        .returning();

    await ensureUserRole(user.id, 'creator');
    return inserted[0];
}

export async function listUserRoles(userId: string) {
    const roles = await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, userId));

    return roles.map((entry) => entry.role as PlatformRole);
}

export async function hasAnyRole(userId: string, roles: PlatformRole[]) {
    const rows = await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(and(eq(userRoles.userId, userId), inArray(userRoles.role, roles)));

    return rows.some((entry) => roles.includes(entry.role as PlatformRole));
}

export async function assignRoleToUser(userId: string, role: PlatformRole, grantedByUserId?: string) {
    await ensureUserRole(userId, role, grantedByUserId);
}

export async function requireReviewAccess(user: User) {
    await ensurePlatformUser(user);
    const roles = await listUserRoles(user.id);
    const allowed = roles.includes('admin') || roles.includes('reviewer');

    if (!allowed) {
        throw new Error('FORBIDDEN_REVIEW_ACCESS');
    }

    return roles;
}
