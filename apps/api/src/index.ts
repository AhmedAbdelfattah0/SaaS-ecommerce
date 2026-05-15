import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { tenantRouter } from './routes/tenant.routes';
import { themeRouter } from './routes/theme.routes';
import { productsRouter } from './routes/products.routes';
import { ordersRouter } from './routes/orders.routes';
import { authRouter } from './routes/auth.routes';
import { billingRouter } from './routes/billing.routes';
import { teamRouter } from './routes/team.routes';
import { tenantMiddleware } from './middleware/tenant.middleware';

export type Env = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  LEMONSQUEEZY_API_KEY: string;
  LEMONSQUEEZY_WEBHOOK_SECRET: string;
  // Admin app URL used as the redirect target for invite + reset emails.
  // Dev: http://localhost:4200 | Prod: https://admin.<your-domain>
  ADMIN_URL: string;
  // TODO(Task 26): Sentry runtime monitoring
  // Install @sentry/cloudflare when Workers support stabilises.
  // Initialize with: Sentry.init({ dsn: c.env.SENTRY_DSN, ... })
  // Add beforeSend hook to strip passwords, tokens, card data, emails.
  SENTRY_DSN?: string;
  ENVIRONMENT?: string;
};

export type Variables = {
  tenant: {
    id: string;
    name: string;
    plan: string;
    status: string;
    customDomain: string;
  };
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ============================================================
// CORS
// ============================================================
app.use('*', cors());

// ============================================================
// Public routes — no tenant middleware required
// ============================================================

// Tenant resolution — used by storefront on init
app.route('/api/tenant', tenantRouter);

// Auth — login/logout are public (no tenant middleware needed here)
app.route('/api/auth', authRouter);

// Billing checkout — public (unauthenticated user registering)
// Webhook — public (called by Lemon Squeezy, verified by HMAC signature internally)
app.route('/api/billing', billingRouter);

// ============================================================
// Protected routes — tenant resolved from Host header
// ============================================================
app.use('/api/*', tenantMiddleware);

app.route('/api/theme', themeRouter);
app.route('/api/products', productsRouter);
app.route('/api/categories', productsRouter); // categories sub-routes handled inside productsRouter
app.route('/api/orders', ordersRouter);
app.route('/api/customers', ordersRouter); // customers sub-routes handled inside ordersRouter
app.route('/api/team', teamRouter);

// ============================================================
// Health check
// ============================================================
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default app;
