'use client';

import { useCallback, useRef } from 'react';
import {
  Stack,
  Center,
  Text,
  Button,
  ThemeIcon,
  Loader,
  Card,
  Skeleton,
  Affix,
  ActionIcon,
} from '@mantine/core';
import { IconNotebook, IconPencilPlus } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useDiaryEntries } from '@/hooks/use-diary';
import { DiaryCard } from '@/components/diary/DiaryCard';

export default function FeedPage() {
  const router = useRouter();
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useDiaryEntries();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  const allEntries = data?.pages.flatMap((page) => page.data) ?? [];
  const pinnedEntries = allEntries.filter((e) => e.isPinned);
  const regularEntries = allEntries.filter((e) => !e.isPinned);
  const totalEntries = data?.pages[0]?.meta.total ?? 0;

  if (isLoading) {
    return (
      <Stack gap="md">
        {[1, 2, 3].map((i) => (
          <Card key={i} shadow="sm" padding="md" radius="md" withBorder>
            <Skeleton height={16} width="40%" mb="md" />
            <Skeleton height={60} mb="sm" />
            <Skeleton height={120} radius="sm" />
          </Card>
        ))}
      </Stack>
    );
  }

  if (isError) {
    return (
      <Center h="50vh">
        <Text c="red">เกิดข้อผิดพลาดในการโหลดข้อมูล</Text>
      </Center>
    );
  }

  if (totalEntries === 0) {
    return (
      <Center h="70vh">
        <Stack align="center" gap="lg">
          <ThemeIcon size={80} radius="xl" variant="light" color="violet">
            <IconNotebook size={40} />
          </ThemeIcon>
          <Text size="xl" fw={500} c="dimmed">
            ยังไม่มีไดอารี่
          </Text>
          <Text size="sm" c="dimmed">
            เริ่มเขียนไดอารี่วันนี้เลย!
          </Text>
          <Button
            size="lg"
            leftSection={<IconPencilPlus size={20} />}
            onClick={() => router.push('/diary/new')}
          >
            เริ่มเขียนไดอารี่แรก
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <>
      <Stack gap="md">
        {pinnedEntries.length > 0 && (
          <>
            <Text size="sm" c="dimmed" fw={500}>
              📌 ปักหมุด
            </Text>
            {pinnedEntries.map((entry) => (
              <DiaryCard key={entry.id} entry={entry} />
            ))}
          </>
        )}

        {regularEntries.map((entry) => (
          <DiaryCard key={entry.id} entry={entry} />
        ))}

        {hasNextPage && (
          <div ref={loadMoreRef}>
            <Center py="md">
              {isFetchingNextPage ? (
                <Loader size="sm" />
              ) : (
                <Button variant="subtle" onClick={() => fetchNextPage()}>
                  โหลดเพิ่ม
                </Button>
              )}
            </Center>
          </div>
        )}
      </Stack>

      <Affix position={{ bottom: 90, right: 20 }}>
        <ActionIcon
          size="xl"
          radius="xl"
          variant="filled"
          color="violet"
          onClick={() => router.push('/diary/new')}
        >
          <IconPencilPlus size={24} />
        </ActionIcon>
      </Affix>
    </>
  );
}
