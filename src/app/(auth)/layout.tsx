export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            B
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Brightloop</h1>
          <p className="text-sm text-muted-foreground">
            Subscription Management System
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
