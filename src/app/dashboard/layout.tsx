import { AppSidebar } from '@/components/app-sidebar';
import { checkAuth } from '@/app/actions';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await checkAuth();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
