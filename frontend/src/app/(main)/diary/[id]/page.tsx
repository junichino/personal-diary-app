'use client';

import { useState } from 'react';
import {
  Stack,
  Card,
  Group,
  Text,
  Badge,
  ActionIcon,
  Button,
  Image,
  SimpleGrid,
  Divider,
  Center,
  Loader,
  Modal,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconPin,
  IconPinFilled,
  IconBookmark,
  IconBookmarkFilled,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import {
  useDiaryEntry,
  useDeleteDiary,
  useTogglePin,
  useToggleBookmark,
} from '@/hooks/use-diary';
import { getMediaUrl } from '@/lib/media-utils';
import { MOODS } from '@/components/diary/MoodPicker';

dayjs.locale('th');

export default function DiaryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: entry, isLoading } = useDiaryEntry(id);
  const deleteDiary = useDeleteDiary();
  const togglePin = useTogglePin();
  const toggleBookmark = useToggleBookmark();

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const handleDelete = () => {
    modals.openConfirmModal({
      title: 'ลบไดอารี่',
      children: (
        <Text size="sm">คุณต้องการลบไดอารี่นี้หรือไม่?</Text>
      ),
      labels: { confirm: 'ลบ', cancel: 'ยกเลิก' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        deleteDiary.mutate(id, {
          onSuccess: () => {
            notifications.show({
              message: 'ลบไดอารี่แล้ว',
              color: 'green',
            });
            router.push('/');
          },
        });
      },
    });
  };

  if (isLoading) {
    return (
      <Center h="50vh">
        <Loader />
      </Center>
    );
  }

  if (!entry) {
    return (
      <Center h="50vh">
        <Text c="dimmed">ไม่พบไดอารี่</Text>
      </Center>
    );
  }

  const moodInfo = entry.mood
    ? MOODS.find((m) => m.value === entry.mood)
    : null;

  return (
    <Stack gap="md">
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        onClick={() => router.push('/')}
        w="fit-content"
      >
        กลับ
      </Button>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="lg" fw={600}>
          {dayjs(`${entry.entryDate} ${entry.entryTime}`).format(
            'วันdddd ที่ D MMMM YYYY',
          )}
        </Text>
        <Text size="sm" c="dimmed">
          {dayjs(`${entry.entryDate} ${entry.entryTime}`).format('HH:mm น.')}
        </Text>

        {moodInfo && (
          <Group mt="md" gap="xs">
            <Text size="xl">{moodInfo.emoji}</Text>
            <div>
              <Text size="sm" fw={500}>
                {moodInfo.label}
              </Text>
              {entry.moodScore != null && (
                <Text size="xs" c="dimmed">
                  ระดับ {entry.moodScore}/5
                </Text>
              )}
            </div>
          </Group>
        )}

        <Text mt="md" style={{ whiteSpace: 'pre-wrap' }}>
          {entry.content}
        </Text>

        {entry.media.length > 0 && (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mt="md">
            {entry.media.map((m) => (
              <Image
                key={m.id}
                src={getMediaUrl(m.storedName)}
                alt=""
                radius="sm"
                fit="cover"
                style={{ cursor: 'pointer' }}
                onClick={() => setLightboxImage(getMediaUrl(m.storedName))}
              />
            ))}
          </SimpleGrid>
        )}

        {entry.tags.length > 0 && (
          <Group gap="xs" mt="md">
            {entry.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="light"
                color={tag.color}
                size="sm"
              >
                {tag.name}
              </Badge>
            ))}
          </Group>
        )}

        <Divider my="md" />

        <Group>
          <ActionIcon
            variant="subtle"
            color={entry.isPinned ? 'violet' : 'gray'}
            onClick={() => togglePin.mutate(id)}
            loading={togglePin.isPending}
          >
            {entry.isPinned ? (
              <IconPinFilled size={20} />
            ) : (
              <IconPin size={20} />
            )}
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color={entry.isBookmarked ? 'yellow' : 'gray'}
            onClick={() => toggleBookmark.mutate(id)}
            loading={toggleBookmark.isPending}
          >
            {entry.isBookmarked ? (
              <IconBookmarkFilled size={20} />
            ) : (
              <IconBookmark size={20} />
            )}
          </ActionIcon>
          <Button
            variant="subtle"
            size="compact-sm"
            leftSection={<IconPencil size={16} />}
            onClick={() => router.push(`/diary/${id}/edit`)}
          >
            แก้ไข
          </Button>
          <Button
            variant="subtle"
            size="compact-sm"
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={handleDelete}
            loading={deleteDiary.isPending}
          >
            ลบ
          </Button>
        </Group>

        <Group mt="md" gap="xl">
          <Text size="xs" c="dimmed">
            สร้างเมื่อ {dayjs(entry.createdAt).format('D MMM YYYY HH:mm')}
          </Text>
          <Text size="xs" c="dimmed">
            แก้ไขล่าสุด {dayjs(entry.updatedAt).format('D MMM YYYY HH:mm')}
          </Text>
        </Group>
      </Card>

      <Modal
        opened={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        size="xl"
        centered
        withCloseButton
      >
        {lightboxImage && (
          <Image src={lightboxImage} alt="" fit="contain" mah="80vh" />
        )}
      </Modal>
    </Stack>
  );
}
