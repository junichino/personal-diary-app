'use client';

import { useEffect } from 'react';
import { AppShell, Box, useMantineColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAppStore } from '@/stores/app.store';

export function AppShellLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const { setColorScheme } = useMantineColorScheme();
  const loadSettings = useAppStore((s) => s.loadSettings);

  useEffect(() => {
    loadSettings().then((settings) => {
      if (settings) {
        setColorScheme(settings.darkMode ? 'dark' : 'light');
      }
    });
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthGuard>
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        padding="md"
      >
        <AppShell.Header>
          <Header opened={opened} toggle={toggle} />
        </AppShell.Header>
        <AppShell.Navbar>
          <Sidebar />
        </AppShell.Navbar>
        <AppShell.Main>
          {children}
          {/* Spacer for mobile bottom nav */}
          <Box h={70} hiddenFrom="sm" />
        </AppShell.Main>
      </AppShell>
      <BottomNav />
    </AuthGuard>
  );
}
