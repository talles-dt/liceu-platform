export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REQUIREMENTS = "Pelo menos 8 caracteres, uma letra maiúscula e um símbolo (por exemplo: !, @ ou #).";

export function passwordError(password: unknown): string | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) return "Senha deve ter no mínimo 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "Senha deve conter pelo menos 1 letra maiúscula.";
  if (!/[!@#$%^&*()_+{};':"\\|,.<>?~-]/.test(password)) return "Senha deve conter pelo menos 1 símbolo.";
  return null;
}
