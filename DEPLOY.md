# VisioCar - Déploiement Complet

## Architecture

- **Frontend**: React + Vite + Tailwind (Netlify/Vercel)
- **Backend**: Node.js + Express + Supabase (Render.com)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth

## URLs de Production

- **Backend API**: https://visiocar-hdhh.onrender.com
- **Frontend**: https://visiocar.netlify.app (à configurer)

## Variables d'Environnement Frontend

Crée un fichier `.env` dans le dossier `visiocar/`:

```env
VITE_SUPABASE_URL=https://dpgzrymeqwwjpoxoiwaf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_ATYFiiMT19IEPLdlxRMeug_3kqTsyQD
VITE_API_URL=https://visiocar-hdhh.onrender.com/api
VITE_PUBLIC_APP_URL=https://visiocar.netlify.app
```

## Déploiement Frontend sur Netlify

### Option 1: CLI (Recommandé)

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Initialiser le site
cd visiocar
netlify init

# Déployer
netlify deploy --prod
```

### Option 2: GitHub + Netlify (Auto-deploy)

1. Va sur https://app.netlify.com/
2. **"Add new site"** → **"Import an existing project"**
3. Choisis GitHub → `ludquiz-hash/visiocaret`
4. Configuration:
   - **Base directory**: `visiocar`
   - **Build command**: `npm run build`
   - **Publish directory**: `visiocar/dist`
5. **Environment variables**:
   ```
   VITE_SUPABASE_URL=https://dpgzrymeqwwjpoxoiwaf.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_ATYFiiMT19IEPLdlxRMeug_3kqTsyQD
   VITE_API_URL=https://visiocar-hdhh.onrender.com/api
   VITE_PUBLIC_APP_URL=https://visiocar.netlify.app
   ```
6. **Deploy site**

### Option 3: Vercel

1. Va sur https://vercel.com/
2. **"Add New Project"**
3. Importe `ludquiz-hash/visiocaret`
4. **Root Directory**: `visiocar`
5. **Framework**: Vite
6. Ajoute les mêmes variables d'environnement
7. **Deploy**

## Tables Supabase Requises

Exécute ce SQL dans Supabase → SQL Editor:

```sql
-- Enable RLS
alter table auth.users enable row level security;

-- Profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Garages table
CREATE TABLE garages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT 'Mon Garage',
  company_name text,
  company_phone text,
  company_email text,
  plan_type text DEFAULT 'starter',
  is_subscribed boolean DEFAULT false,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE garages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own garage"
  ON garages FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can update own garage"
  ON garages FOR UPDATE
  USING (auth.uid() = owner_id);

-- Claims table
CREATE TABLE claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_number text,
  status text DEFAULT 'draft',
  client_name text,
  client_email text,
  client_phone text,
  client_address text,
  vehicle_brand text,
  vehicle_model text,
  vehicle_year text,
  vehicle_vin text,
  vehicle_license_plate text,
  insurance_company text,
  insurance_policy_number text,
  photos jsonb DEFAULT '[]',
  damage_description text,
  damage_areas jsonb DEFAULT '[]',
  estimated_repair_cost text,
  expert_notes text,
  repair_recommendations text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own claims"
  ON claims FOR ALL
  USING (auth.uid() = user_id);

-- Members table
CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid REFERENCES garages(id) ON DELETE CASCADE,
  user_email text,
  role text DEFAULT 'staff',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view garage members"
  ON members FOR SELECT
  USING (
    garage_id IN (
      SELECT id FROM garages WHERE owner_id = auth.uid()
    )
  );

-- Storage bucket for photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('claim-photos', 'claim-photos', true);

-- Storage policies
CREATE POLICY "Users can upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'claim-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'claim-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Fonctionnalités

| Feature | Backend | Frontend | Statut |
|---------|---------|----------|--------|
| Auth (Email OTP) | Supabase | Supabase | ✅ |
| CRUD Dossiers | ✅ | ✅ | ✅ |
| Upload Photos | ✅ | ✅ | ✅ |
| Génération PDF | ✅ | ✅ | ✅ |
| Équipe/Garage | ✅ | ✅ | ✅ |
| Abonnement | Stripe | Stripe | ✅ (optionnel) |

## Support

En cas de problème:
1. Vérifie les logs sur Render Dashboard
2. Vérifie les logs sur Netlify Dashboard
3. Vérifie la console navigateur (F12)
4. Vérifie les tables Supabase
