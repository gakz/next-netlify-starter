import { defineConfig } from 'drizzle-kit'

// Use direct connection for migrations (required for DDL operations)
// Falls back to DATABASE_URL if DATABASE_URL_DIRECT is not set
const connectionUrl = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL

if (!connectionUrl) {
  throw new Error('DATABASE_URL_DIRECT or DATABASE_URL must be set')
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionUrl,
  },
})
