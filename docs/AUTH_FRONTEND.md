# Fluxo de autenticação — Frontend

Resumo do que o app implementa, espelhando `docs/AUTH_API.md`.

## Cadastro (`/register`)

1. Validação Zod (nome, e-mail, senha forte, confirmação).
2. `POST /api/v1/auth/register` com `full_name`, `email`, `password`, `password_confirm`.
3. E-mail guardado em `sessionStorage` para reenvio.
4. Em dev/test, `verification_token` da resposta é guardado para teste sem SMTP.
5. Redirect → `/verify-email?email=...`.

## Confirmação (`/verify-email`)

1. Query `?token=` → `POST /api/v1/auth/verify`.
2. Botão reenviar → `POST /api/v1/auth/resend-verification`.
3. Sucesso → redirect automático para `/login` após 2,5s.

Configure na API: `FRONTEND_VERIFY_URL=https://seu-dominio/verify-email` (com `?token=` no link do e-mail).

## Login (`/login`)

1. Firebase `signInWithEmailAndPassword`.
2. `getIdToken()` → `POST /api/v1/auth/login`.
3. Cookie de sessão + redirect `/dashboard`.
4. Erro `account_not_verified` → redirect `/verify-email`.

## Sessão persistente

Ao recarregar, Firebase restaura usuário → `onAuthStateChanged` repete login na API e atualiza perfil.

## Logout

Menu do header → `POST /auth/logout`, `signOut`, apaga cookie, vai para `/login`.

## Recuperação de senha

| Página | Ação |
|--------|------|
| `/forgot-password` | `sendPasswordResetEmail` |
| `/reset-password?oobCode=` | `confirmPasswordReset` |

## Chamadas autenticadas

Todas usam `Authorization: Bearer <firebase_id_token>` via `apiRequest({ auth: true })`.
