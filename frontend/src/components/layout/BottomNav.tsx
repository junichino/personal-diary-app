'use client';

import { Box, UnstyledButton, Group, Text } from '@mantine/core';
import {
  IconHome,
  IconPencilPlus,
  IconBookmark,
  IconSettings,
} from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { icon: IconHome, label: 'หน้าแรก', href: '/' },
  { icon: IconPencilPlus, label: 'เขียน', href: '/diary/new' },
  { icon: IconBookmark, label: 'บุ๊คมาร์ค', href: '/bookmarks' },
  { icon: IconSettings, label: 'ตั้งค่า', href: '/settings' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Box
      hiddenFrom="sm"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        borderTop: '1px solid var(--mantine-color-default-border)',
        backgroundColor: 'var(--mantine-color-body)',
      }}
    >
      <Group grow h={60} px="xs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <UnstyledButton
              key={tab.href}
              onClick={() => router.push(tab.href)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <tab.icon
                size={22}
                stroke={1.5}
                color={isActive ? 'var(--mantine-color-violet-6)' : undefined}
              />
              <Text size="xs" c={isActive ? 'violet' : 'dimmed'}>
                {tab.label}
              </Text>
            </UnstyledButton>
          );
        })}
      </Group>
    </Box>
  );
}
