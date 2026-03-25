'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Center,
  Title,
  Text,
  PinInput,
  Button,
  Stack,
  Alert,
  Anchor,
} from '@mantine/core';
import { IconLock, IconAlertCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { useAuthStatus, useVerifyPin } from '@/hooks/use-auth';
import type { ApiErrorData } from '@/types';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: authStatus, isLoading: isCheckingAuth } = useAuthStatus();
  const verifyPin = useVerifyPin();

  useEffect(() => {
    if (authStatus) {
      if (!authStatus.isSetup) {
        router.replace('/setup');
      } else if (authStatus.isAuthenticated) {
        router.replace('/');
      }
    }
  }, [authStatus, router]);

  const handleSubmit = async (value: string) => {
    if (value.length !== 6) return;
    setError('');
    try {
      await verifyPin.mutateAsync(value);
      router.replace('/');
    } catch (err) {
      setPin('');
      const axiosError = err as AxiosError<ApiErrorData>;
      setError(axiosError.response?.data?.error?.message || 'PIN ไม่ถูกต้อง');
    }
  };

  if (isCheckingAuth) {
    return null;
  }

  return (
    <Center h="100vh" p="md">
      <Card shadow="md" padding="xl" radius="lg" w="100%" maw={400}>
        <Stack align="center" gap="lg">
          <IconLock size={48} color="var(--mantine-color-violet-6)" />
          <Title order={2}>My Diary</Title>
          <Text c="dimmed" size="sm">
            ใส่ PIN 6 หลักเพื่อเข้าสู่ระบบ
          </Text>

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
              w="100%"
            >
              {error}
            </Alert>
          )}

          <PinInput
            value={pin}
            onChange={setPin}
            onComplete={handleSubmit}
            length={6}
            size="xl"
            type="number"
            mask
            oneTimeCode
            disabled={verifyPin.isPending}
            aria-label="PIN"
          />

          <Button
            fullWidth
            size="md"
            loading={verifyPin.isPending}
            disabled={pin.length !== 6}
            onClick={() => handleSubmit(pin)}
          >
            เข้าสู่ระบบ
          </Button>

          <Anchor
            size="sm"
            c="dimmed"
            onClick={() => router.push('/setup')}
            style={{ cursor: 'pointer' }}
          >
            ยังไม่มี PIN? ตั้งค่าที่นี่
          </Anchor>
        </Stack>
      </Card>
    </Center>
  );
}
