import { AppShellLayout } from '@/components/layout/AppShellLayout';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
