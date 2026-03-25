'use client';

import { Group, UnstyledButton, Text, Stack } from '@mantine/core';

export const MOODS = [
  { value: 'happy', label: 'มีความสุข', emoji: '😊' },
  { value: 'sad', label: 'เศร้า', emoji: '😢' },
  { value: 'neutral', label: 'เฉยๆ', emoji: '😐' },
  { value: 'excited', label: 'ตื่นเต้น', emoji: '🤩' },
  { value: 'angry', label: 'โกรธ', emoji: '😤' },
  { value: 'anxious', label: 'กังวล', emoji: '😰' },
  { value: 'grateful', label: 'ขอบคุณ', emoji: '🙏' },
  { value: 'tired', label: 'เหนื่อย', emoji: '😴' },
];

interface MoodPickerProps {
  value: string | null;
  onChange: (mood: string | null) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <Group gap="xs" wrap="wrap">
      {MOODS.map((mood) => (
        <UnstyledButton
          key={mood.value}
          onClick={() => onChange(value === mood.value ? null : mood.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--mantine-radius-md)',
            border:
              value === mood.value
                ? '2px solid var(--mantine-color-violet-6)'
                : '2px solid var(--mantine-color-default-border)',
            backgroundColor:
              value === mood.value
                ? 'var(--mantine-color-violet-light)'
                : 'transparent',
            transition: 'all 150ms ease',
          }}
        >
          <Stack gap={2} align="center">
            <Text size="xl">{mood.emoji}</Text>
            <Text size="xs" c={value === mood.value ? 'violet' : 'dimmed'}>
              {mood.label}
            </Text>
          </Stack>
        </UnstyledButton>
      ))}
    </Group>
  );
}
