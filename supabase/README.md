# Supabase — structure & exécution

## TL;DR (nouveau projet)
Dans Supabase → **SQL Editor**, exécute :
1. `supabase/sql/00_fresh_install.sql`
2. (optionnel) `supabase/ops/supabase-realtime-enable.sql`
3. (optionnel) `supabase/ops/supabase-performance-optimizations.sql`

## Organisation
- **`supabase/sql/`**
  - `00_fresh_install.sql` : script “one-shot” pour un **nouveau** projet Supabase
- **`supabase/migrations/`**
  - scripts historiques (upgrade / correctifs ponctuels)
- **`supabase/legacy/`**
  - scripts historiques initiaux (conservés pour référence)
- **`supabase/ops/`**
  - scripts opérationnels (Realtime, index, perfs)


