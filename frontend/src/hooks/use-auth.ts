import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api-client';
import type { AuthStatus } from '@/types';

export function useAuthStatus() {
  return useQuery({
    queryKey: ['auth', 'status'],
    queryFn: () => apiGet<AuthStatus>('/api/v1/auth/status'),
    retry: false,
  });
}

export function useSetupPin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pin: string) =>
      apiPost<{ message: string }>('/api/v1/auth/setup', { pin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'status'] });
    },
  });
}

export function useVerifyPin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pin: string) =>
      apiPost<{ message: string }>('/api/v1/auth/verify-pin', { pin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'status'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ message: string }>('/api/v1/auth/logout', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'status'] });
    },
  });
}
