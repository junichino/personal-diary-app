'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Loader } from '@mantine/core';
import { useAuthStatus } from '@/hooks/use-auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, isLoading } = useAuthStatus();

  useEffect(() => {
    if (!isLoading && data) {
      if (!data.isSetup) {
        router.replace('/setup');
      } else if (!data.isAuthenticated) {
        router.replace('/login');
      }
    }
  }, [data, isLoading, router]);

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" color="violet" />
      </Center>
    );
  }

  if (!data?.isAuthenticated) {
    return (
      <Center h="100vh">
        <Loader size="lg" color="violet" />
      </Center>
    );
  }

  return <>{children}</>;
}
