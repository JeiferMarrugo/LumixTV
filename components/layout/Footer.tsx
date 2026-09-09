import { Logo } from "@/components/ui/Logo";

const footerLinks = [
  "Política de Privacidad",
  "Términos de Servicio",
  "Centro de Ayuda",
  "Preferencias de Cookies",
  "Contacto",
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border-subtle bg-surface px-6 py-10 pb-28 lg:pb-10">
      <div className="flex flex-col items-center gap-6">
        <Logo size="sm" align="center" />

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <button
              key={link}
              type="button"
              className="text-xs text-zinc-500 transition-colors hover:text-gold-500"
            >
              {link}
            </button>
          ))}
        </nav>

        <p className="text-xs text-zinc-600">
          © {new Date().getFullYear()} LumixTV. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
