interface PageHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
}

export function PageHeader({ title, subtitle, count }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {count !== undefined && (
        <span className="text-sm text-zinc-500">{count} resultados</span>
      )}
    </div>
  );
}
