import { Layout } from '@/components/layout/layout';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ClassProvider } from '@/contexts/ClassContext';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');

  if (!session?.value) {
    redirect('/login');
  }

  return (
    <ClassProvider>
      <Layout>{children}</Layout>
    </ClassProvider>
  );
}
