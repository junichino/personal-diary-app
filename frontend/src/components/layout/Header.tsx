'use client';

import {
  Group,
  Burger,
  ActionIcon,
  Title,
  TextInput,
  useMantineColorScheme,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconSun,
  IconMoon,
  IconLogout,
  IconSearch,
  IconX,
} from '@tabler/icons-react';
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
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
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
      <Group gap="xs" style={{ flex: 1, maxWidth: 400, marginInline: 'auto' }}>
        <TextInput
          placeholder="ค้นหาไดอารี่..."
          leftSection={<IconSearch size={16} />}
          rightSection={
            searchQuery ? (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => setSearchQuery('')}
              >
                <IconX size={14} />
              </ActionIcon>
            ) : null
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          style={{ flex: 1 }}
          size="sm"
        />
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
