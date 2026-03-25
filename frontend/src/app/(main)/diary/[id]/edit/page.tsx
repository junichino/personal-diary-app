'use client';

import { Container, Title, Center, Loader, Text } from '@mantine/core';
import { useParams } from 'next/navigation';
import { useDiaryEntry } from '@/hooks/use-diary';
import { DiaryForm } from '@/components/diary/DiaryForm';

export default function EditDiaryPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: entry, isLoading } = useDiaryEntry(id);

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

  return (
    <Container size="sm">
      <Title order={2} mb="lg">
        แก้ไขไดอารี่
      </Title>
      <DiaryForm mode="edit" initialData={entry} />
    </Container>
  );
}
