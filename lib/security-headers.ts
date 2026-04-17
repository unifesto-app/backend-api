/**
 * API Security Configuration
 * Ensures secure communication between frontend and API
 * Configures CORS, CSP, and other security headers
 */

export const getSecurityHeaders = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const headers: Record<string, string> = {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clicks in iframes
    'Cross-Origin-Opener-Policy': 'same-origin',
    
    // Control resource sharing
    'Cross-Origin-Resource-Policy': 'same-site',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Disable permissions
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), accelerometer=(), gyroscope=()',
    
    // No indexing for local/dev servers
    'X-Robots-Tag': isDevelopment ? 'noindex, nofollow' : 'all',
  };

  // HSTS for production only
  if (!isDevelopment) {
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload';
  }

  return headers;
};

/**
 * CORS configuration for ecosystem apps
 * Allows communication between main, admin-dashboard, and API
 */
export const getCorsConfig = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const allowedOrigins = [
    // Production domains
    'https://unifesto.app',
    'https://admin.unifesto.app',
    'https://api.unifesto.app',
    'https://db.unifesto.app',
    
    // Development domains
    'http://localhost:3000', // main
    'http://localhost:3001', // admin-dashboard
    'http://localhost:4000', // api
    'http://localhost:54321', // local supabase
  ];

  // Allow only allowed origins (or all in dev)
  const corsOrigin = isDevelopment
    ? '*' // Allow all origins in development
    : allowedOrigins;

  return {
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: [
      'Content-Length',
      'X-Request-ID',
      'X-Response-Time',
    ],
    maxAge: 86400, // 24 hours
  };
};

/**
 * Content Security Policy configuration
 * Restricts resource loading to prevent XSS attacks
 */
export const getCspHeader = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const policy = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval'`, // Unsafe for dev, tighten in production
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https: ${isDevelopment ? 'ws: wss:' : ''}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');

  return policy;
};

/**
 * Apply security headers to Next.js response
 */
export const applySecurityHeaders = (response: Response) => {
  const headers = getSecurityHeaders();
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  response.headers.set('Content-Security-Policy', getCspHeader());
  
  return response;
};
