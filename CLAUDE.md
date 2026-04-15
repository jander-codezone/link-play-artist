# CLAUDE.md — Link&Play Artists Dashboard

## Project Description

Artist-facing SaaS dashboard for the Link&Play platform. Artists and their representatives use this app to manage their availability, bookings (contrataciones), billing, and subscription plans. The UI is entirely in Spanish.

Built with Lovable (AI code generator). Several pages are still partially mocked — see Known Issues.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.8 |
| UI framework | React 18 |
| Bundler | Vite + SWC |
| Routing | React Router v6 |
| Component library | shadcn/ui (Radix UI + Tailwind CSS v3) |
| Server state | TanStack React Query v5 |
| Forms | react-hook-form + zod |
| Charts | recharts |
| Dates | date-fns (Spanish locale) |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| Payments | Stripe (via Supabase Edge Functions only) |
| Package manager | bun |

---

## Key Directories and Architecture

```
src/
  App.tsx                          # Router + global providers
  main.tsx                         # Entry point
  index.css                        # Tailwind + CSS design tokens (light/dark)
  assets/                          # Logo image
  contexts/
    AuthContext.tsx                 # Global auth state, all Supabase auth calls
  components/
    ProtectedRoute.tsx             # Route guard (currently disabled — see Known Issues)
    NavLink.tsx                    # Active-aware nav link wrapper
    layout/
      AppLayout.tsx                # Main page layout (sidebar + content area)
      AppSidebar.tsx               # Sidebar nav + user profile + logout
    configuracion/                 # Sub-components for the Configuracion page
      DisponibilidadSemanal.tsx
      ExcepcionesDisponibilidad.tsx
      DisponibilidadPremium.tsx
      GestionArtistas.tsx
    ui/                            # shadcn/ui generated components — do not restructure
  pages/
    Auth.tsx                       # Login + register (email/password + Google OAuth)
    AuthCallback.tsx               # OAuth redirect handler + profile completion
    Dashboard.tsx                  # KPI cards + charts (partially mocked)
    Calendario.tsx                 # Weekly calendar grid (static shell, no DB data)
    Contrataciones.tsx             # Booking list — real Supabase queries
    Facturacion.tsx                # Billing page (mix of real + mocked data)
    Notificaciones.tsx             # Notification list (fully mocked)
    Configuracion.tsx              # Profile, availability, subscription management
    Suscripciones.tsx              # Stripe plan selection and checkout
    NotFound.tsx                   # 404
  integrations/
    supabase/
      client.ts                    # Auto-generated — do not edit manually
      types.ts                     # Auto-generated — regenerate with `supabase gen types`
  lib/
    subscription-tiers.ts          # Stripe price/product IDs and plan config
    utils.ts                       # cn() helper
  hooks/
    use-toast.ts
    use-mobile.tsx
```

Provider chain in `App.tsx` (outermost to innermost):
```
QueryClientProvider > TooltipProvider > BrowserRouter > AuthProvider > Routes
```

---

## Supabase Integration

**Client:** `src/integrations/supabase/client.ts` — uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Session is persisted in `localStorage`.

**Types:** `src/integrations/supabase/types.ts` — full TypeScript map of all DB tables. Regenerate with:
```bash
supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts
```

**Database tables:**

| Table | Purpose |
|---|---|
| `user_profiles` | Primary user profile (linked to Supabase auth.users) |
| `perfiles` | Legacy profile table — used by Configuracion page (inconsistency, see Known Issues) |
| `artistas` | Artist records; FK to `perfiles` via `perfil_artista_id` or `representante_id` |
| `artista_disponibilidad_semanal` | Recurring weekly availability per day |
| `artista_disponibilidad` | Date-specific availability exceptions |
| `artista_disponibilidad_premium` | Premium availability: date + city + special fee |
| `eventos` | Events linked to artists |
| `contrataciones` | Bookings joining artista + negocio + evento |
| `negocios` | Venues/businesses |
| `espacios` | Physical venue spaces |
| `espacio_disponibilidad` | Space-level availability |
| `notificaciones` | In-app notifications (not yet wired to UI) |

**User type enum** (`user_profiles.tipo_usuario`): `"venue" | "artista" | "representante"`
**Venue subtype enum** (`user_profiles.subtipo_venue`): `"contratante" | "espacio" | "ambos"`

Always import the client like this:
```ts
import { supabase } from "@/integrations/supabase/client";
```

---

## Authentication Flow

All auth logic lives in `src/contexts/AuthContext.tsx`. The `AuthProvider` wraps the entire router.

**Methods exposed via `useAuth()`:**
- `signUp(email, password, { nombre, telefono, tipo_usuario })` — creates auth user + inserts `user_profiles` row
- `signIn(email, password)`
- `signInWithGoogle()` — OAuth redirect to `/auth/callback`
- `signOut()`
- `updateProfile(updates)` — patches `user_profiles`
- `refreshProfile()` — re-fetches profile from DB

**State:** `{ user, session, profile, loading }`

**Initialization order** (important — avoids Supabase deadlocks):
1. `onAuthStateChange` listener is registered first
2. Profile fetch inside the listener is deferred with `setTimeout(0)`
3. `getSession()` is called after to hydrate existing sessions

**Google OAuth flow:**
1. `signInWithGoogle()` redirects to Google
2. Google redirects to `/auth/callback`
3. `AuthCallback.tsx` checks if `user_profiles` exists for the user
4. If not → shows profile completion form (nombre + telefono + tipo_usuario)
5. On submit → inserts `user_profiles` row → navigates to `/`

**Route protection:** `src/components/ProtectedRoute.tsx` — **currently disabled**. The check is commented out. To re-enable, uncomment lines 11–23.

---

## Stripe Integration (via Supabase Edge Functions)

Stripe is never called directly from the frontend. All Stripe logic runs in three Supabase Edge Functions. The frontend invokes them via:

```ts
const { data, error } = await supabase.functions.invoke("function-name", { body: { ... } });
```

| Edge Function | Invoked in | Purpose |
|---|---|---|
| `check-subscription` | `Suscripciones.tsx`, `Configuracion.tsx` | Returns `{ subscribed, product_id, price_id, subscription_end }` |
| `create-checkout` | `Suscripciones.tsx` | Creates Stripe Checkout session → returns `{ url }` |
| `customer-portal` | `Suscripciones.tsx`, `Configuracion.tsx` | Opens Stripe billing portal → returns `{ url }` |

**Plan configuration** (`src/lib/subscription-tiers.ts`) — LIVE mode Stripe IDs:

| Plan | User type | Price | price_id |
|---|---|---|---|
| Estándar | artista | 12.99€/mo | `price_1Sx5xvGOghH19qqnSM4g4fw2` |
| Premium | artista | 19.99€/mo | `price_1Sx5y8GOghH19qqnf0h0Abmy` |
| Estándar | representante | 100€/mo | `price_1Sx5yLGOghH19qqnsrxwCLsT` |
| Premium | representante | 150€/mo | `price_1Sx5ycGOghH19qqnAGatoqlb` |

All plans include a 30-day free trial (`TRIAL_DAYS = 30`).

The plan shown to the user is determined by `profile.tipo_usuario` via `getTiersForUserType()`.

The Edge Functions themselves are **not in this repository** — they live in the Supabase project. Stripe secret keys are Edge Function secrets, never in `.env`.

---

## Known Architectural Issues

**1. ProtectedRoute is disabled.**
`ProtectedRoute.tsx` passes children unconditionally. Re-enable the commented guard before any production deployment.

**2. Dual profile table inconsistency.**
`AuthContext` reads/writes `user_profiles`. `Configuracion.tsx` reads/writes the `perfiles` table. These are two different tables representing the same concept. Unifying them is a required cleanup task.

**3. Pages with hardcoded mock data (not connected to Supabase):**
- `Dashboard.tsx` — all stat values and chart data are static
- `Notificaciones.tsx` — notifications array is hardcoded
- `Facturacion.tsx` — invoice stats and recent invoices list are hardcoded; only "facturación potencial" and the historical chart use real queries

**4. Calendario has no data layer.**
The weekly grid renders correctly but no events are ever fetched or displayed.

**5. Contrataciones artista lookup may return empty.**
The query filters by `perfil_artista_id.eq.${profile.user_id}`, but `user_id` in `user_profiles` is the Supabase auth UUID while `perfil_artista_id` in `artistas` references the `perfiles` table ID — these will not match unless explicitly linked.

**6. Google OAuth redirect URL must be allowlisted** in the Supabase Auth dashboard (`<domain>/auth/callback`).

---

## Rules for Modifying Code Safely

- **Never edit** `src/integrations/supabase/client.ts` or `src/integrations/supabase/types.ts` manually. Regenerate types with the Supabase CLI when the schema changes.
- **Never edit** `src/components/ui/*.tsx` files as structural rewrites — they are shadcn/ui components. Styling tweaks via Tailwind classes on the caller side are fine.
- **Always use** `import { supabase } from "@/integrations/supabase/client"` — never instantiate a second client.
- **Always use** `useAuth()` to access user/session/profile — never read `localStorage` directly for auth state.
- **Forms** must use react-hook-form + zod. Do not add uncontrolled inputs or manual `useState` for form fields.
- **Data fetching** in page components should use `useQuery` from TanStack React Query. Direct `useEffect` + fetch is acceptable only for fire-and-forget mutations or complex sequences (as in Configuracion).
- The UI language is **Spanish**. Keep all user-visible strings, variable names, and DB column references in Spanish.
- Stripe plan IDs in `subscription-tiers.ts` are **LIVE** mode. Do not swap to test IDs without coordinating with the backend.
- Do not add new top-level pages without registering them in both `App.tsx` (route) and `AppSidebar.tsx` (nav item).

---

## Local Development

**Prerequisites:** bun, Node.js 18+, a Supabase project with the schema applied.

```bash
# Install dependencies
bun install

# Create .env at project root
cp .env.example .env  # or create manually

# Required .env variables:
# VITE_SUPABASE_URL=https://<project-id>.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
# VITE_SUPABASE_PROJECT_ID=<project-id>

# Start dev server (http://localhost:5173)
bun dev

# Type-check
bun run build  # also validates TS

# Lint
bun run lint
```

**Regenerate Supabase types after schema changes:**
```bash
bunx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts
```

**Add a new shadcn/ui component:**
```bash
bunx shadcn@latest add <component-name>
```
