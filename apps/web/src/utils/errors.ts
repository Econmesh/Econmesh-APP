import type { ApiErrorBody } from "@/types/api";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  missing_token: "Sessão expirada. Faça login novamente.",
  token_expired: "Sua sessão expirou. Faça login novamente.",
  token_revoked: "Sessão inválida. Faça login novamente.",
  token_invalid: "Não foi possível validar sua sessão. Tente entrar novamente.",
  session_revoked: "Sessão encerrada em outro dispositivo. Faça login novamente.",
  account_not_verified: "Confirme seu e-mail antes de entrar.",
  account_disabled: "Conta desativada. Entre em contato com o suporte.",
  email_already_exists: "Este e-mail já está cadastrado.",
  invalid_credentials: "Não foi possível criar a conta. Verifique os dados informados.",
  invalid_verification_token: "Link de confirmação inválido.",
  verification_token_used: "Este link já foi utilizado.",
  verification_token_expired: "Link expirado. Solicite um novo e-mail.",
  user_not_found: "Usuário não encontrado.",
  validation_error: "Verifique os campos do formulário.",
  rate_limited: "Muitas tentativas. Aguarde e tente novamente.",
  internal_error: "Erro interno. Tente novamente mais tarde.",
};

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "E-mail inválido.",
  "auth/user-disabled": "Conta desativada.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/too-many-requests": "Muitas tentativas. Tente mais tarde.",
  "auth/email-already-in-use": "Este e-mail já está em uso.",
  "auth/weak-password": "Senha muito fraca.",
  "auth/expired-action-code": "Link expirado. Solicite um novo.",
  "auth/invalid-action-code": "Link inválido ou já utilizado.",
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown> | null;

  constructor(status: number, body: ApiErrorBody) {
    const friendly =
      AUTH_ERROR_MESSAGES[body.code] ?? body.message ?? "Ocorreu um erro inesperado.";
    super(friendly);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

export function mapFirebaseError(code: string): string {
  return FIREBASE_ERROR_MESSAGES[code] ?? "Não foi possível concluir a operação.";
}

export function getValidationFieldErrors(
  details: Record<string, unknown> | null | undefined,
): Record<string, string> {
  const errors = details?.errors;
  if (!Array.isArray(errors)) return {};

  const out: Record<string, string> = {};
  for (const item of errors) {
    if (
      item &&
      typeof item === "object" &&
      "loc" in item &&
      Array.isArray((item as { loc: unknown }).loc)
    ) {
      const loc = (item as { loc: (string | number)[] }).loc;
      const field = String(loc[loc.length - 1] ?? "form");
      const msg =
        "msg" in item && typeof (item as { msg: unknown }).msg === "string"
          ? (item as { msg: string }).msg
          : "Valor inválido.";
      out[field] = msg;
    }
  }
  return out;
}
