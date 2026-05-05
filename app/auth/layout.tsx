export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6 py-16">
      {children}
    </main>
  );
}
