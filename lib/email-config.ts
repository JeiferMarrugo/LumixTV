/** Modo desarrollo sin dominio propio */
export const isDevEmailMode =
  process.env.EMAIL_MODE === "dev" ||
  process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "false";

export const requireEmailVerification =
  process.env.AUTH_REQUIRE_EMAIL_VERIFICATION !== "false";

export const resendFromEmail =
  process.env.RESEND_FROM_EMAIL?.includes("onboarding@resend.dev") ||
  !process.env.RESEND_FROM_EMAIL
    ? "LumixTV <onboarding@resend.dev>"
    : process.env.RESEND_FROM_EMAIL.includes("<")
      ? process.env.RESEND_FROM_EMAIL
      : `LumixTV <${process.env.RESEND_FROM_EMAIL}>`;
