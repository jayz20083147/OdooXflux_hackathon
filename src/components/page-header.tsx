export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 pb-6 border-b border-border/60 mb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="text-sm font-medium text-muted-foreground mt-0.5">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex items-center gap-2.5">{children}</div> : null}
    </div>
  );
}
