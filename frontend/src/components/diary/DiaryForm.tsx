'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Stack,
  Textarea,
  Group,
  Button,
  Text,
  Image,
  Box,
  CloseButton,
  Slider,
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconPhoto, IconX, IconPlus } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import type { DiaryEntry, Media } from '@/types';
import { useCreateDiary, useUpdateDiary } from '@/hooks/use-diary';
import { getThumbnailUrl } from '@/lib/media-utils';
import { MoodPicker } from './MoodPicker';

interface ImagePreview {
  file: File;
  previewUrl: string;
}

interface DiaryFormProps {
  mode: 'create' | 'edit';
  initialData?: DiaryEntry;
}

export function DiaryForm({ mode, initialData }: DiaryFormProps) {
  const router = useRouter();
  const createDiary = useCreateDiary();
  const updateDiary = useUpdateDiary();

  const [content, setContent] = useState(initialData?.content ?? '');
  const [entryDate, setEntryDate] = useState<string | null>(
    initialData?.entryDate ?? dayjs().format('YYYY-MM-DD'),
  );
  const [entryTime, setEntryTime] = useState(
    initialData ? initialData.entryTime.slice(0, 5) : dayjs().format('HH:mm'),
  );
  const [mood, setMood] = useState<string | null>(initialData?.mood ?? null);
  const [moodScore, setMoodScore] = useState<number>(
    initialData?.moodScore ?? 3,
  );
  const [newImages, setNewImages] = useState<ImagePreview[]>([]);
  const [existingMedia, setExistingMedia] = useState<Media[]>(
    initialData?.media ?? [],
  );
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);

  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const isSubmitting = createDiary.isPending || updateDiary.isPending;
  const totalImageCount = existingMedia.length + newImages.length;

  const handleDrop = (files: File[]) => {
    const maxNewFiles = Math.max(0, 10 - totalImageCount);
    const filesToAdd = files.slice(0, maxNewFiles);
    const previews = filesToAdd.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(previewUrl);
      return { file, previewUrl };
    });
    setNewImages((prev) => [...prev, ...previews]);
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => {
      const item = prev[index];
      URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRemoveExistingMedia = (media: Media) => {
    setExistingMedia((prev) => prev.filter((m) => m.id !== media.id));
    setRemovedMediaIds((prev) => [...prev, media.id]);
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      notifications.show({ message: 'กรุณาเขียนเนื้อหา', color: 'red' });
      return;
    }
    if (!entryDate) {
      notifications.show({ message: 'กรุณาเลือกวันที่', color: 'red' });
      return;
    }

    const dateStr = entryDate ?? dayjs().format('YYYY-MM-DD');
    const timeStr = entryTime ? entryTime + ':00' : '00:00:00';

    if (mode === 'create') {
      createDiary.mutate(
        {
          content: content.trim(),
          entryDate: dateStr,
          entryTime: timeStr,
          mood: mood ?? undefined,
          moodScore: mood ? moodScore : undefined,
          images: newImages.length > 0 ? newImages.map((i) => i.file) : undefined,
        },
        {
          onSuccess: () => {
            notifications.show({
              message: 'บันทึกไดอารี่แล้ว',
              color: 'green',
            });
            router.push('/');
          },
          onError: () => {
            notifications.show({
              message: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
              color: 'red',
            });
          },
        },
      );
    } else {
      updateDiary.mutate(
        {
          id: initialData!.id,
          data: {
            content: content.trim(),
            entryDate: dateStr,
            entryTime: timeStr,
            mood: mood ?? undefined,
            moodScore: mood ? moodScore : undefined,
            removeMediaIds:
              removedMediaIds.length > 0 ? removedMediaIds : undefined,
            newImages:
              newImages.length > 0 ? newImages.map((i) => i.file) : undefined,
          },
        },
        {
          onSuccess: () => {
            notifications.show({
              message: 'อัปเดตไดอารี่แล้ว',
              color: 'green',
            });
            router.push(`/diary/${initialData!.id}`);
          },
          onError: () => {
            notifications.show({
              message: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
              color: 'red',
            });
          },
        },
      );
    }
  };

  return (
    <Stack gap="md">
      <Textarea
        label="เนื้อหา"
        placeholder="วันนี้เป็นยังไงบ้าง..."
        value={content}
        onChange={(e) => setContent(e.currentTarget.value)}
        autosize
        minRows={4}
        maxRows={12}
        required
      />

      <Group grow>
        <DateInput
          label="วันที่"
          value={entryDate}
          onChange={setEntryDate}
          valueFormat="D MMMM YYYY"
          locale="th"
          required
        />
        <TimeInput
          label="เวลา"
          value={entryTime}
          onChange={(e) => setEntryTime(e.currentTarget.value)}
          required
        />
      </Group>

      <div>
        <Text size="sm" fw={500} mb="xs">
          อารมณ์
        </Text>
        <MoodPicker value={mood} onChange={setMood} />
        {mood && (
          <Slider
            value={moodScore}
            onChange={setMoodScore}
            min={1}
            max={5}
            step={1}
            marks={[
              { value: 1, label: '1' },
              { value: 2, label: '2' },
              { value: 3, label: '3' },
              { value: 4, label: '4' },
              { value: 5, label: '5' },
            ]}
            mt="sm"
            mb="lg"
            label={(val) => `${val}/5`}
            color="violet"
          />
        )}
      </div>

      <div>
        <Text size="sm" fw={500} mb="xs">
          รูปภาพ
        </Text>

        {existingMedia.length > 0 && (
          <Group gap="xs" mb="sm">
            {existingMedia.map((media) => (
              <Box key={media.id} pos="relative">
                <Image
                  src={getThumbnailUrl(media.storedName)}
                  alt=""
                  w={100}
                  h={100}
                  radius="sm"
                  fit="cover"
                />
                <CloseButton
                  size="sm"
                  pos="absolute"
                  top={4}
                  right={4}
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                  c="white"
                  onClick={() => handleRemoveExistingMedia(media)}
                />
              </Box>
            ))}
          </Group>
        )}

        {newImages.length > 0 && (
          <Group gap="xs" mb="sm">
            {newImages.map((item, index) => (
              <Box key={item.previewUrl} pos="relative">
                <Image
                  src={item.previewUrl}
                  alt=""
                  w={100}
                  h={100}
                  radius="sm"
                  fit="cover"
                />
                <CloseButton
                  size="sm"
                  pos="absolute"
                  top={4}
                  right={4}
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                  c="white"
                  onClick={() => handleRemoveNewImage(index)}
                />
              </Box>
            ))}
          </Group>
        )}

        {totalImageCount < 10 && (
          <Dropzone
            onDrop={handleDrop}
            maxSize={10 * 1024 ** 2}
            accept={IMAGE_MIME_TYPE}
          >
            <Group
              justify="center"
              gap="xl"
              mih={100}
              style={{ pointerEvents: 'none' }}
            >
              <Dropzone.Accept>
                <IconUpload
                  size={40}
                  stroke={1.5}
                  color="var(--mantine-color-violet-6)"
                />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX
                  size={40}
                  stroke={1.5}
                  color="var(--mantine-color-red-6)"
                />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconPhoto
                  size={40}
                  stroke={1.5}
                  color="var(--mantine-color-dimmed)"
                />
              </Dropzone.Idle>
              <div>
                <Text size="sm" inline>
                  ลากรูปมาวางหรือคลิกเพื่อเลือก
                </Text>
                <Text size="xs" c="dimmed" inline mt={7}>
                  รองรับ JPEG, PNG, WebP, GIF — สูงสุด 10MB ต่อรูป (เหลือ{' '}
                  {10 - totalImageCount} รูป)
                </Text>
              </div>
            </Group>
          </Dropzone>
        )}
      </div>

      <div>
        <Text size="sm" fw={500} mb="xs">
          แท็ก
        </Text>
        <Button
          variant="light"
          size="xs"
          disabled
          leftSection={<IconPlus size={14} />}
        >
          เพิ่ม tag
        </Button>
      </div>

      <Group justify="flex-end">
        <Button
          variant="subtle"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          ยกเลิก
        </Button>
        <Button onClick={handleSubmit} loading={isSubmitting}>
          บันทึก
        </Button>
      </Group>
    </Stack>
  );
}
