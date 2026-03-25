'use client';

import { ScrollArea, Stack, NavLink } from '@mantine/core';
import {
  IconHome,
  IconPencil,
  IconBookmark,
  IconCalendar,
  IconChartBar,
  IconSettings,
} from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { icon: IconHome, label: 'หน้าแรก', href: '/', disabled: false },
  { icon: IconPencil, label: 'เขียนไดอารี่', href: '/diary/new', disabled: false },
  { icon: IconBookmark, label: 'บุ๊คมาร์ค', href: '/bookmarks', disabled: true },
  { icon: IconCalendar, label: 'ปฏิทิน', href: '/calendar', disabled: true },
  { icon: IconChartBar, label: 'สถิติ', href: '/stats', disabled: true },
  { icon: IconSettings, label: 'ตั้งค่า', href: '/settings', disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <ScrollArea>
      <Stack gap={4} p="xs">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            label={item.label}
            leftSection={<item.icon size={20} stroke={1.5} />}
            active={pathname === item.href}
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) router.push(item.href);
            }}
            style={{ borderRadius: 'var(--mantine-radius-md)' }}
          />
        ))}
      </Stack>
    </ScrollArea>
  );
}
