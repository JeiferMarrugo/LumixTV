interface VerificationEmailParams {
  to: string;
  name: string;
  url: string;
}

const GOLD = "#d4a017";
const GOLD_LIGHT = "#e8c547";
const GOLD_DIM = "#a67c00";
const BG = "#050505";
const CARD = "#111111";
const CARD_INNER = "#161616";
const BORDER = "#2a2418";
const TEXT = "#f4f4f5";
const MUTED = "#a1a1aa";
const DIM = "#71717a";

export function buildVerificationEmail({ name, url }: VerificationEmailParams) {
  const subject = "Confirma tu cuenta en LumixTV";
  const displayName = formatDisplayName(name);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Segoe UI',Inter,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Confirma tu correo para activar tu cuenta en LumixTV y empezar a ver contenido.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};background-image:radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,160,23,0.14), transparent 60%);">
    <tr>
      <td align="center" style="padding:48px 20px;">

        <!-- Logo -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:26px;font-weight:700;letter-spacing:0.22em;color:${GOLD};font-family:Georgia,'Times New Roman',serif;">
                    LUMIX
                  </td>
                  <td style="width:1px;padding:0 14px;">
                    <div style="width:1px;height:18px;background:linear-gradient(to bottom, transparent, ${GOLD}88, transparent);"></div>
                  </td>
                  <td style="font-size:11px;font-weight:600;letter-spacing:0.55em;color:${DIM};font-family:'Segoe UI',Arial,sans-serif;">
                    TV
                  </td>
                </tr>
              </table>
              <div style="height:1px;width:160px;margin:10px auto 0;background:linear-gradient(to right, transparent, ${GOLD}, transparent);"></div>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${CARD};border:1px solid ${BORDER};border-radius:20px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,160,23,0.06);">

          <!-- Hero strip -->
          <tr>
            <td style="padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px;background:linear-gradient(to right, transparent, ${GOLD}, ${GOLD_LIGHT}, ${GOLD}, transparent);"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Badge + title -->
          <tr>
            <td style="padding:36px 40px 0;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                <tr>
                  <td style="padding:6px 16px;border-radius:999px;background:rgba(212,160,23,0.12);border:1px solid rgba(212,160,23,0.25);">
                    <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${GOLD_LIGHT};">
                      ✦ Bienvenido a LumixTV
                    </span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0 0 10px;font-size:26px;font-weight:700;line-height:1.25;color:${TEXT};letter-spacing:-0.02em;">
                Hola, ${escapeHtml(displayName)}
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.65;color:${MUTED};">
                Tu cuenta está casi lista. Solo falta un paso para desbloquear películas, series, anime y TV en vivo.
              </p>
            </td>
          </tr>

          <!-- Features -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CARD_INNER};border:1px solid ${BORDER};border-radius:14px;">
                <tr>
                  ${featureCell("🎬", "Contenido premium", "Accede a todo el catálogo de LumixTV", true)}
                  ${featureCell("⚡", "Activación instantánea", "Un clic y ya puedes entrar", true)}
                  ${featureCell("🔒", "Cuenta segura", "Tu correo queda verificado", false)}
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:32px 40px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius:14px;background:linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 45%, ${GOLD_DIM} 100%);box-shadow:0 8px 28px rgba(212,160,23,0.35), inset 0 1px 0 rgba(255,255,255,0.25);">
                    <a href="${url}" target="_blank" style="display:inline-block;padding:16px 40px;font-size:15px;font-weight:800;letter-spacing:0.02em;color:#0a0a0a;text-decoration:none;">
                      Confirmar mi cuenta →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-size:12px;color:${DIM};">
                El enlace expira en 1 hora por seguridad.
              </p>
            </td>
          </tr>

          <!-- Fallback URL -->
          <tr>
            <td style="padding:20px 40px 36px;">
              <p style="margin:0 0 10px;font-size:12px;color:${DIM};text-align:center;">
                ¿El botón no funciona? Copia este enlace:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 14px;background:#0c0c0c;border:1px solid ${BORDER};border-radius:10px;">
                    <a href="${url}" style="font-size:11px;line-height:1.6;color:${GOLD};word-break:break-all;text-decoration:none;font-family:Consolas,'Courier New',monospace;">
                      ${url}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 40px;border-top:1px solid ${BORDER};background:#0c0c0c;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:${DIM};">
                Si no creaste esta cuenta, puedes ignorar este correo.
              </p>
              <p style="margin:0;font-size:11px;color:#52525b;">
                © LumixTV · <a href="https://lumixtv.stream" style="color:${GOLD_DIM};text-decoration:none;">lumixtv.stream</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hola ${displayName},

¡Bienvenido a LumixTV!

Confirma tu cuenta visitando este enlace:
${url}

El enlace expira en 1 hora.

Si no creaste esta cuenta, ignora este correo.

— LumixTV · lumixtv.stream`;

  return { subject, html, text };
}

function featureCell(icon: string, title: string, desc: string, showBorder: boolean) {
  const border = showBorder ? `border-right:1px solid ${BORDER};` : "";
  return `
    <td width="33%" align="center" style="padding:16px 10px;vertical-align:top;${border}">
      <p style="margin:0 0 6px;font-size:20px;line-height:1;">${icon}</p>
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${TEXT};">${title}</p>
      <p style="margin:0;font-size:10px;line-height:1.45;color:${DIM};">${desc}</p>
    </td>`;
}

function formatDisplayName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "Usuario";
  return trimmed
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
