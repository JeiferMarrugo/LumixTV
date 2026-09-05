/**
 * Configura el dominio lumixtv.com en Resend y muestra los registros DNS.
 *
 * Uso: npm run email:setup-domain
 */
import { Resend } from "resend";
import "dotenv/config";

const DOMAIN = process.env.RESEND_DOMAIN ?? "lumixtv.com";

async function main() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("❌ Falta RESEND_API_KEY en tu archivo .env");
    process.exit(1);
  }

  const resend = new Resend(apiKey);

  console.log(`\n🔍 Buscando dominio "${DOMAIN}" en Resend...\n`);

  const { data: list, error: listError } = await resend.domains.list();

  if (listError) {
    if (listError.message?.includes("restricted")) {
      printManualInstructions();
      process.exit(0);
    }
    console.error("❌ Error al listar dominios:", listError.message);
    process.exit(1);
  }

  let domain = list?.data?.find((d) => d.name === DOMAIN);

  if (!domain) {
    console.log(`📌 Dominio no encontrado. Creando "${DOMAIN}"...\n`);

    const { data: created, error: createError } = await resend.domains.create({
      name: DOMAIN,
      region: "us-east-1",
    });

    if (createError) {
      console.error("❌ Error al crear dominio:", createError.message);
      process.exit(1);
    }

    domain = created;
    console.log("✅ Dominio creado.\n");
  } else {
    console.log(`✅ Dominio ya existe (estado: ${domain.status}).\n`);
  }

  if (!domain?.id) {
    console.error("❌ No se pudo obtener el dominio.");
    process.exit(1);
  }

  const { data: details, error: getError } = await resend.domains.get(domain.id);

  if (getError || !details) {
    console.error("❌ Error al obtener registros DNS:", getError?.message);
    process.exit(1);
  }

  console.log("═══════════════════════════════════════════════════");
  console.log(`  Dominio: ${details.name}`);
  console.log(`  Estado:  ${details.status}`);
  console.log(`  Región:  ${details.region}`);
  console.log("═══════════════════════════════════════════════════\n");
  console.log("Agrega estos registros DNS en tu proveedor de dominio");
  console.log("(GoDaddy, Namecheap, Cloudflare, etc.):\n");

  for (const record of details.records ?? []) {
    console.log(`  [${record.record}] ${record.type}`);
    console.log(`    Nombre:  ${record.name}`);
    console.log(`    Valor:   ${record.value}`);
    if (record.priority) console.log(`    Prioridad: ${record.priority}`);
    console.log(`    Estado:  ${record.status}`);
    console.log("");
  }

  console.log("───────────────────────────────────────────────────");
  console.log("Cuando todos los registros estén en verde en Resend:");
  console.log(`  RESEND_FROM_EMAIL="LumixTV <hello@${DOMAIN}>"`);
  console.log("───────────────────────────────────────────────────\n");

  if (details.status === "verified") {
    console.log("🎉 ¡Dominio verificado! Ya puedes enviar correos de producción.\n");
  } else {
    console.log("⏳ Esperando verificación DNS (puede tardar hasta 48h).\n");
    console.log("   Revisa el estado en: https://resend.com/domains\n");
  }
}

main();

function printManualInstructions() {
  console.log("⚠️  Tu API key es de solo envío (Sending access).");
  console.log("   Configura el dominio manualmente en el dashboard:\n");
  console.log("   1. Ve a https://resend.com/domains");
  console.log(`   2. Clic en "Add Domain" → ingresa: ${DOMAIN}`);
  console.log("   3. Copia los registros DNS (SPF, DKIM, MX) que te muestra");
  console.log("   4. Agrégalos en tu proveedor de dominio (donde compraste lumixtv.com)");
  console.log("   5. Espera verificación (unos minutos a 48h)\n");
  console.log("   Registros típicos que verás:");
  console.log("   • TXT  → SPF (send.lumixtv.com)");
  console.log("   • CNAME → 3 registros DKIM");
  console.log("   • MX   → send.lumixtv.com\n");
  console.log("   Cuando esté verificado, tu .env ya está listo:");
  console.log(`   RESEND_FROM_EMAIL="LumixTV <hello@${DOMAIN}>"\n`);
  console.log("   Opcional: crea una API key con 'Full access' en");
  console.log("   https://resend.com/api-keys para usar este script automáticamente.\n");
}
