export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-mint via-card to-brand-peach/15 px-4 py-10 selection:bg-brand-peach/30">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-ocean to-[#26628d] text-xl font-bold text-white shadow-md ring-4 ring-brand-ocean/15">
            B
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Brightloop</h1>
            <span className="rounded-full bg-brand-peach/30 text-[#9a4b16] px-2 py-0.5 text-[10px] font-bold">
              OS
            </span>
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">
            Subscription Management System
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
