import { neonAuth } from '@neondatabase/auth/next/server'
import { redirect } from 'next/navigation'

/**
 * Get the current authenticated user from a server component.
 * Redirects to /login if not authenticated.
 */
export async function getCurrentUser() {
  const { user } = await neonAuth()
  if (!user) {
    redirect('/login')
  }
  return user
}

/**
 * Get the current authenticated user without redirecting.
 * Returns null if not authenticated.
 */
export async function getCurrentUserOrNull() {
  const { user } = await neonAuth()
  return user
}

/**
 * Ensure the user exists in our database.
 * Called on first login to create the user row.
 */
export async function ensureUserInDatabase(userId: string, email: string) {
  if (!process.env.DATABASE_URL) {
    return
  }

  try {
    const { db } = await import('@/db')
    const { users } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!existingUser) {
      // Create user on first login
      await db.insert(users).values({
        id: userId,
        email,
      })
    }
  } catch (error) {
    console.error('Failed to ensure user in database:', error)
  }
}
