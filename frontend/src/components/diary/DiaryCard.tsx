'use client';

import {
  Card,
  Group,
  Text,
  Badge,
  ActionIcon,
  Image,
  SimpleGrid,
  Box,
  Tooltip,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconPin,
  IconPinFilled,
  IconBookmark,
  IconBookmarkFilled,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import type { DiaryEntry } from '@/types';
import { getThumbnailUrl } from '@/lib/media-utils';
import { useTogglePin, useToggleBookmark, useDeleteDiary } from '@/hooks/use-diary';
import { MOODS } from './MoodPicker';

dayjs.locale('th');

interface DiaryCardProps {
  entry: DiaryEntry;
}

export function DiaryCard({ entry }: DiaryCardProps) {
  const router = useRouter();
  const togglePin = useTogglePin();
  const toggleBookmark = useToggleBookmark();
  const deleteDiary = useDeleteDiary();

  const moodInfo = entry.mood
    ? MOODS.find((m) => m.value === entry.mood)
    : null;

  const isLongContent = entry.content.length > 300;
  const displayContent = isLongContent
    ? entry.content.slice(0, 300) + '...'
    : entry.content;

  const formattedDate = dayjs(
    `${entry.entryDate} ${entry.entryTime}`,
  ).format('D MMM YYYY · HH:mm');

  const handleDelete = () => {
    modals.openConfirmModal({
      title: 'ลบไดอารี่',
      children: (
        <Text size="sm">
          คุณต้องการลบไดอารี่นี้หรือไม่? การลบสามารถกู้คืนได้
        </Text>
      ),
      labels: { confirm: 'ลบ', cancel: 'ยกเลิก' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        deleteDiary.mutate(entry.id, {
          onSuccess: () => {
            notifications.show({ message: 'ลบไดอารี่แล้ว', color: 'green' });
          },
        });
      },
    });
  };

  const renderMediaGallery = () => {
    const { media } = entry;
    if (media.length === 0) return null;

    const MAX_VISIBLE = 4;
    const showOverlay = media.length > MAX_VISIBLE;
    const visibleMedia = showOverlay
      ? media.slice(0, MAX_VISIBLE - 1)
      : media;
    const remaining = media.length - visibleMedia.length;

    return (
      <SimpleGrid cols={media.length === 1 ? 1 : 2} spacing="xs" mt="sm">
        {visibleMedia.map((m) => (
          <Image
            key={m.id}
            src={getThumbnailUrl(m.storedName)}
            alt=""
            radius="sm"
            h={media.length === 1 ? 300 : 150}
            fit="cover"
            style={{ cursor: 'pointer' }}
            onClick={() => router.push(`/diary/${entry.id}`)}
          />
        ))}
        {showOverlay && (
          <Box
            pos="relative"
            style={{
              cursor: 'pointer',
              borderRadius: 'var(--mantine-radius-sm)',
              overflow: 'hidden',
            }}
            onClick={() => router.push(`/diary/${entry.id}`)}
          >
            <Image
              src={getThumbnailUrl(media[MAX_VISIBLE - 1].storedName)}
              alt=""
              h={150}
              fit="cover"
              style={{ filter: 'brightness(0.4)' }}
            />
            <Box
              pos="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              style={{ alignItems: 'center', justifyContent: 'center' }}
            >
              <Text c="white" size="xl" fw={700}>
                +{remaining}
              </Text>
            </Box>
          </Box>
        )}
      </SimpleGrid>
    );
  };

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      {entry.isPinned && (
        <Badge variant="light" color="violet" size="sm" mb="xs">
          📌 ปักหมุด
        </Badge>
      )}

      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed">
          {formattedDate}
        </Text>
        {moodInfo && (
          <Badge variant="light" color="violet">
            {moodInfo.emoji} {moodInfo.label}
          </Badge>
        )}
      </Group>

      <Text
        size="sm"
        style={{ whiteSpace: 'pre-wrap', cursor: 'pointer' }}
        onClick={() => router.push(`/diary/${entry.id}`)}
      >
        {displayContent}
      </Text>
      {isLongContent && (
        <Text
          size="sm"
          c="violet"
          style={{ cursor: 'pointer' }}
          onClick={() => router.push(`/diary/${entry.id}`)}
          mt={4}
        >
          อ่านเพิ่มเติม...
        </Text>
      )}

      {renderMediaGallery()}

      {entry.tags && entry.tags.length > 0 && (
        <Group gap="xs" mt="sm">
          {entry.tags.map((tag) => (
            <Badge key={tag.id} variant="light" color={tag.color} size="sm">
              {tag.name}
            </Badge>
          ))}
        </Group>
      )}

      <Group justify="flex-end" mt="md" gap="xs">
        <Tooltip label={entry.isPinned ? 'เลิกปักหมุด' : 'ปักหมุด'}>
          <ActionIcon
            variant="subtle"
            color={entry.isPinned ? 'violet' : 'gray'}
            onClick={() => togglePin.mutate(entry.id)}
            loading={togglePin.isPending}
          >
            {entry.isPinned ? (
              <IconPinFilled size={18} />
            ) : (
              <IconPin size={18} />
            )}
          </ActionIcon>
        </Tooltip>
        <Tooltip label={entry.isBookmarked ? 'เลิกบุ๊กมาร์ก' : 'บุ๊กมาร์ก'}>
          <ActionIcon
            variant="subtle"
            color={entry.isBookmarked ? 'yellow' : 'gray'}
            onClick={() => toggleBookmark.mutate(entry.id)}
            loading={toggleBookmark.isPending}
          >
            {entry.isBookmarked ? (
              <IconBookmarkFilled size={18} />
            ) : (
              <IconBookmark size={18} />
            )}
          </ActionIcon>
        </Tooltip>
        <Tooltip label="แก้ไข">
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => router.push(`/diary/${entry.id}/edit`)}
          >
            <IconPencil size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="ลบ">
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={handleDelete}
            loading={deleteDiary.isPending}
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Card>
  );
}
