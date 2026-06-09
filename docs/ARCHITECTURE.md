# Arquitetura Frontend — Econmesh App

## Visão geral

Monorepo **Turborepo** com app Next.js 16 (App Router) em `apps/web`, design system em `packages/ui` e validação de ambiente em `packages/env`.

## Estrutura (`apps/web/src`)

```
src/
├── app/                    # Rotas Next.js (App Router)
│   ├── (auth)/             # login, register, verify-email, forgot/reset password
│   ├── (dashboard)/        # área autenticada
│   ├── (marketing)/        # landing pública
│   └── api/auth/session/   # cookie httpOnly para middleware
├── components/             # UI transversal (auth guards, feedback, header)
├── layouts/                # AuthLayout, DashboardLayout
├── modules/                # Domínios de negócio
│   ├── auth/
│   └── dashboard/
├── services/               # Cliente HTTP + auth.service
├── hooks/                  # useAuth
├── stores/                 # auth-store (estado síncrono leve)
├── contexts/               # AuthProvider (Firebase + API)
├── types/                  # Contratos alinhados à API
├── utils/                  # erros, validação Zod
├── lib/                    # firebase, constants
└── styles/                 # overrides de tema
```

## Decisões arquiteturais

### 1. Firebase + API (dois passos no login)

A API **não emite JWT próprio**. O fluxo é:

1. Cliente autentica no **Firebase Auth** (`signInWithEmailAndPassword`).
2. Obtém **ID token** e chama `POST /api/v1/auth/login`.
3. Usa o mesmo ID token como `Authorization: Bearer` em rotas protegidas.

**Motivo:** alinhar 100% com `econmesh-api` (`LoginRequest.id_token`, `get_current_user`).

### 2. Cookie de sessão + middleware

- Cookie `econmesh_session` (httpOnly, flag) definido via `POST /api/auth/session`.
- **Middleware** protege rotas `/dashboard`, `/profile`, `/settings` no edge.
- **AuthGuard** (client) garante estado Firebase + perfil API antes de renderizar dashboard.

Tokens Firebase permanecem no SDK (IndexedDB); o cookie **não** armazena o JWT — apenas indica sessão ativa para o edge.

### 3. Renovação e logout

- `onIdTokenChanged` + intervalo de 10 min: `getIdToken(true)` e refresh de `/auth/me`.
- Interceptor HTTP: em `401` com códigos de token → logout e redirect `/login`.
- Logout: `POST /auth/logout` + `signOut` Firebase + limpar cookie.

### 4. Recuperação de senha

Sem endpoint na API → **Firebase** `sendPasswordResetEmail` / `confirmPasswordReset`.

### 5. Estado

- **Zustand leve** (`authStore`) + `useSyncExternalStore` para evitar re-renders desnecessários no Provider.
- Sem Redux: escopo atual não justifica.

### 6. Validação

- **Zod** nos formulários (client) espelhando regras da API (`full_name`, senha 8+, confirmação).
- Erros da API mapeados em `utils/errors.ts` (`ApiError`, códigos estáveis).

### 7. UI/UX

- Tema escuro padrão, acentos azul-infra (`styles/theme-overrides.css`).
- shadcn/base-lyra em `packages/ui`, Sonner para toasts, skeletons para loading.

## Rotas

| Rota | Grupo | Proteção |
|------|--------|----------|
| `/` | marketing | pública |
| `/login`, `/register`, … | auth | GuestGuard |
| `/dashboard` | dashboard | middleware + AuthGuard |
| `/profile`, `/settings` | dashboard | idem |

## Variáveis de ambiente

Ver `apps/web/.env.example`. Obrigatórias em runtime:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_FIREBASE_*`

Build sem `.env`: `SKIP_ENV_VALIDATION=true npm run build`.

## Próximos passos sugeridos

- TanStack Query para cache de `/me` e módulos futuros.
- Página de confirmação alinhada a `FRONTEND_VERIFY_URL` na API (`/verify-email?token=`).
- Testes E2E (Playwright) para fluxo register → verify → login.
