'use client';

import {
  Group,
  Burger,
  ActionIcon,
  Title,
  useMantineColorScheme,
  useComputedColorScheme,
} from '@mantine/core';
import { IconSun, IconMoon, IconLogout } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useLogout } from '@/hooks/use-auth';
import { useAppStore } from '@/stores/app.store';

interface HeaderProps {
  opened: boolean;
  toggle: () => void;
}

export function Header({ opened, toggle }: HeaderProps) {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  const appName = useAppStore((s) => s.appName);
  const updateDarkMode = useAppStore((s) => s.updateDarkMode);
  const logout = useLogout();
  const router = useRouter();

  const handleToggle = () => {
    const newScheme = computedColorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(newScheme);
    updateDarkMode(newScheme === 'dark');
  };

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.replace('/login');
  };

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <Title order={3}>{appName}</Title>
      </Group>
      <Group>
        <ActionIcon
          variant="default"
          size="lg"
          onClick={handleToggle}
          aria-label="สลับธีม"
        >
          {computedColorScheme === 'dark' ? (
            <IconSun size={18} />
          ) : (
            <IconMoon size={18} />
          )}
        </ActionIcon>
        <ActionIcon
          variant="default"
          size="lg"
          onClick={handleLogout}
          loading={logout.isPending}
          aria-label="ออกจากระบบ"
          visibleFrom="sm"
        >
          <IconLogout size={18} />
        </ActionIcon>
      </Group>
    </Group>
  );
}
