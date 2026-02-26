# VisioCar - Application d'expertise automobile

## Configuration requise

### Variables d'environnement à configurer sur Netlify/Vercel :

```bash
VITE_SUPABASE_URL=https://dpgzrymeqwwjpoxoiwaf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_ATYFiiMT19IEPLdlxRMeug_3kqTsyQD
VITE_PUBLIC_APP_URL=https://your-site.netlify.app
```

## Déploiement

### Netlify :
1. Connecter le repo
2. Build command : `npm run build`
3. Publish directory : `dist`
4. Ajouter les variables d'environnement

### Vercel :
1. Connecter le repo
2. Framework : Vite
3. Ajouter les variables d'environnement

## Tables Supabase requises

- `claims` : Dossiers sinistres
- `profiles` : Profils utilisateurs
- `garages` : Informations garage
- `members` : Membres équipe
