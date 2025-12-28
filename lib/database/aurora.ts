import { Pool, PoolClient } from 'pg';

/**
 * Creates a PostgreSQL connection pool for AWS Aurora
 * This client is used for server-side database operations
 * 
 * Use this for:
 * - Server Components
 * - Server Actions
 * - API Routes
 * - Database operations that need direct PostgreSQL access
 * 
 * @returns {Pool} - PostgreSQL connection pool
 */
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!connectionString) {
      throw new Error(
        'Missing DATABASE_URL or POSTGRES_URL environment variable. ' +
        'Please configure your Aurora database connection string.'
      );
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === undefined 
        ? { rejectUnauthorized: false } 
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

/**
 * Get a client from the pool for transactions
 * Remember to release the client when done: await client.release()
 * 
 * @returns {Promise<PoolClient>} - Database client
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return await pool.connect();
}

/**
 * Execute a query and return results
 * @param {string} text - SQL query
 * @param {any[]} params - Query parameters
 * @returns {Promise<any>} - Query results
 */
export async function query(text: string, params?: any[]) {
  const pool = getPool();
  return await pool.query(text, params);
}

/**
 * Close the connection pool
 * Call this when shutting down the application
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Test database connection
 * @returns {Promise<boolean>} - True if connection is successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

