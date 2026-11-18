// Load .env files
import 'dotenv/config'

// Integration tests run against their own throwaway SQLite database, never the dev one.
process.env.DATABASE_URL = 'file:./.test.db'
