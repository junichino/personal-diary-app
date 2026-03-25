'use client';

import { Container, Title } from '@mantine/core';
import { DiaryForm } from '@/components/diary/DiaryForm';

export default function NewDiaryPage() {
  return (
    <Container size="sm">
      <Title order={2} mb="lg">
        เขียนไดอารี่ใหม่
      </Title>
      <DiaryForm mode="create" />
    </Container>
  );
}
