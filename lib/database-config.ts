/**
 * Database Configuration & Routing
 * Routes all database operations through db.unifesto.app
 * Provides centralized database layer for the Unifesto ecosystem
 */

/**
 * Database connection configuration
 * All database operations should use these settings
 */
export const getDatabaseConfig = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  return {
    // Primary connection through db.unifesto.app
    host: process.env.DATABASE_HOST || 'db.unifesto.app',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    database: process.env.DATABASE_NAME || 'unifesto',
    
    // Authentication
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    
    // Full connection string (takes precedence)
    url: process.env.DATABASE_URL,
    
    // Connection pool settings
    max: isDevelopment ? 5 : 20,
    idleTimeoutMillis: isDevelopment ? 30000 : 30000,
    connectionTimeoutMillis: 5000,
    
    // SSL requirement for production
    ssl: !isDevelopment ? { rejectUnauthorized: true } : false,
  };
};

/**
 * Supabase configuration
 * Handles both client and server-side database operations
 */
export const getSupabaseConfig = () => {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
};

/**
 * Validate database configuration
 * Ensures all required environment variables are set
 */
export const validateDatabaseConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const config = getDatabaseConfig();

  if (!config.url && !config.host) {
    errors.push('Either DATABASE_URL or DATABASE_HOST must be configured');
  }

  if (!config.url && (!config.user || !config.password)) {
    errors.push('DATABASE_USER and DATABASE_PASSWORD required when using DATABASE_HOST');
  }

  const supabaseConfig = getSupabaseConfig();
  if (!supabaseConfig.url) {
    errors.push('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL must be configured');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Log database configuration (sanitized for security)
 */
export const logDatabaseConfig = () => {
  if (process.env.NODE_ENV !== 'production') {
    const config = getDatabaseConfig();
    console.log('[Database Config]', {
      host: config.host,
      port: config.port,
      database: config.database,
      pool: { max: config.max, timeout: config.idleTimeoutMillis },
      ssl: config.ssl,
    });
  }
};
