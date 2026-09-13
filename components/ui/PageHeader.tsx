interface PageHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
}

export function PageHeader({ title, subtitle, count }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{title}</h1>
        {count !== undefined && (
          <span className="hidden shrink-0 text-sm text-zinc-600 dark:text-zinc-500 sm:inline">
            {count.toLocaleString("es")} resultados
          </span>
        )}
      </div>
      {(subtitle || count !== undefined) && (
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-zinc-600 dark:text-zinc-500">
          {subtitle && <span>{subtitle}</span>}
          {subtitle && count !== undefined && (
            <span className="hidden text-zinc-400 sm:inline dark:text-zinc-700" aria-hidden>
              ·
            </span>
          )}
          {count !== undefined && (
            <span className="sm:hidden">{count.toLocaleString("es")} resultados</span>
          )}
        </div>
      )}
    </div>
  );
}
