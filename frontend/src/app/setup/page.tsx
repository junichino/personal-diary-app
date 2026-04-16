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
  ActionIcon,
  Group,
  Tooltip,
} from '@mantine/core';
import {
  IconShieldLock,
  IconAlertCircle,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { useAuthStatus, useSetupPin } from '@/hooks/use-auth';
import type { ApiErrorData } from '@/types';

export default function SetupPage() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const router = useRouter();
  const { data: authStatus, isLoading: isCheckingAuth } = useAuthStatus();
  const setupPin = useSetupPin();

  useEffect(() => {
    if (authStatus) {
      if (authStatus.isSetup && authStatus.isAuthenticated) {
        router.replace('/');
      } else if (authStatus.isSetup) {
        router.replace('/login');
      }
    }
  }, [authStatus, router]);

  const handleSetup = async () => {
    if (pin.length !== 6 || confirmPin.length !== 6) return;

    if (pin !== confirmPin) {
      setError('PIN ไม่ตรงกัน กรุณาลองใหม่');
      setConfirmPin('');
      return;
    }

    setError('');
    try {
      await setupPin.mutateAsync(pin);
      router.replace('/');
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorData>;
      setError(axiosError.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    }
  };

  if (isCheckingAuth) {
    return null;
  }

  return (
    <Center h="100vh" p="md">
      <Card shadow="md" padding="xl" radius="lg" w="100%" maw={400}>
        <Stack align="center" gap="lg">
          <IconShieldLock size={48} color="var(--mantine-color-violet-6)" />
          <Title order={2}>ยินดีต้อนรับ</Title>
          <Text c="dimmed" size="sm" ta="center">
            ตั้ง PIN 6 หลักเพื่อเริ่มใช้งาน
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

          <Stack gap="xs" align="center" w="100%">
            <Group gap="xs">
              <Text size="sm" fw={500}>
                ตั้ง PIN
              </Text>
              <Tooltip label={showPin ? 'ซ่อน PIN' : 'ดู PIN'}>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={() => setShowPin((v) => !v)}
                  aria-label={showPin ? 'ซ่อน PIN' : 'ดู PIN'}
                >
                  {showPin ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </ActionIcon>
              </Tooltip>
            </Group>
            <PinInput
              value={pin}
              onChange={setPin}
              length={6}
              size="lg"
              type="number"
              mask={!showPin}
              oneTimeCode
              disabled={setupPin.isPending}
              aria-label="ตั้ง PIN"
            />
          </Stack>

          <Stack gap="xs" align="center" w="100%">
            <Text size="sm" fw={500}>
              ยืนยัน PIN
            </Text>
            <PinInput
              value={confirmPin}
              onChange={setConfirmPin}
              length={6}
              size="lg"
              type="number"
              mask={!showPin}
              disabled={setupPin.isPending}
              aria-label="ยืนยัน PIN"
            />
          </Stack>

          <Button
            fullWidth
            size="md"
            loading={setupPin.isPending}
            disabled={pin.length !== 6 || confirmPin.length !== 6}
            onClick={handleSetup}
          >
            ตั้ง PIN
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}
