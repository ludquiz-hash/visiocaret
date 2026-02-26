# VisioCar Backend

## Deployment on Render

### 1. Create Web Service
1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repo `ludquiz-hash/visiocaret`
4. Configure:
   - **Name**: visiocar-backend
   - **Root Directory**: backend
   - **Runtime**: Node
   - **Build Command**: npm install
   - **Start Command**: npm start

### 2. Environment Variables
Add these in Render Dashboard → Environment:

```
SUPABASE_URL=https://dpgzrymeqwwjpoxoiwaf.supabase.co
SUPABASE_SERVICE_KEY=sb_service_xxxxx_your_service_key
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.netlify.app
```

### 3. Get Supabase Service Key
1. Go to https://supabase.com/dashboard
2. Your project → Settings → API
3. Copy "service_role key" (NOT the anon key)

### 4. Stripe (Optional)
If you want payments:
```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_STARTER_PRICE_ID=price_xxx
STRIPE_BUSINESS_PRICE_ID=price_xxx
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/auth/me` - Get current user
- `GET /api/claims` - List claims
- `POST /api/claims` - Create claim
- `GET /api/claims/:id` - Get claim
- `PATCH /api/claims/:id` - Update claim
- `DELETE /api/claims/:id` - Delete claim
- `POST /api/claims/:id/pdf` - Generate PDF
- `GET /api/garage` - Get garage info
- `GET /api/garage/members` - List team members
- `GET /api/garage/usage` - Get usage stats
