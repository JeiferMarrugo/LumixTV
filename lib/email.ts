import { Resend } from "resend";
import { buildVerificationEmail } from "@/lib/email-templates/verification";
import { resendFromEmail } from "@/lib/email-config";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function logDevLink(params: { to: string; url: string }) {
  console.log("\n📧 [DEV] Enlace de verificación (copia en el navegador):");
  console.log(`   Para: ${params.to}`);
  console.log(`   URL:  ${params.url}\n`);
}

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  url: string;
}) {
  const { subject, html, text } = buildVerificationEmail(params);

  if (!resend) {
    logDevLink(params);
    return;
  }

  const { error } = await resend.emails.send({
    from: resendFromEmail,
    to: params.to,
    replyTo: process.env.RESEND_REPLY_TO ?? undefined,
    subject,
    html,
    text,
  });

  if (error) {
    console.warn("[Resend]", error.message);

    if (resendFromEmail.includes("onboarding@resend.dev")) {
      console.log(
        "   Tip: con onboarding@resend.dev solo puedes enviar al correo de tu cuenta Resend.",
      );
    }

    logDevLink(params);

    if (process.env.NODE_ENV === "production") {
      throw new Error(error.message);
    }
  }
}

export function getEmailFromAddress() {
  return resendFromEmail;
}
