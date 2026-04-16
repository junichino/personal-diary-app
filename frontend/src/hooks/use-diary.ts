import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { apiGetPaginated, apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { DiaryEntry } from '@/types';

// --- Types ---

export interface DiaryQueryParams {
  page?: number;
  limit?: number;
  mood?: string;
  tag?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  isBookmarked?: boolean;
  isPinned?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateDiaryInput {
  content: string;
  entryDate: string;
  entryTime: string;
  mood?: string;
  moodScore?: number;
  location?: string;
  weather?: string;
  temperature?: number;
  tagIds?: string[];
  images?: File[];
}

export interface UpdateDiaryInput {
  content?: string;
  entryDate?: string;
  entryTime?: string;
  mood?: string;
  moodScore?: number;
  location?: string;
  removeMediaIds?: string[];
  newImages?: File[];
  tagIds?: string[];
}

// --- Helpers ---

const MULTIPART_CONFIG = {
  headers: { 'Content-Type': 'multipart/form-data' },
};

function buildCreateFormData(data: CreateDiaryInput): FormData {
  const fd = new FormData();
  fd.append('content', data.content);
  fd.append('entryDate', data.entryDate);
  fd.append('entryTime', data.entryTime);
  if (data.mood) fd.append('mood', data.mood);
  if (data.moodScore != null) fd.append('moodScore', String(data.moodScore));
  if (data.location) fd.append('location', data.location);
  if (data.weather) fd.append('weather', data.weather);
  if (data.temperature != null) fd.append('temperature', String(data.temperature));
  data.tagIds?.forEach((id) => fd.append('tagIds', id));
  data.images?.forEach((file) => fd.append('images', file));
  return fd;
}

function buildUpdateFormData(data: UpdateDiaryInput): FormData {
  const fd = new FormData();
  if (data.content !== undefined) fd.append('content', data.content);
  if (data.entryDate) fd.append('entryDate', data.entryDate);
  if (data.entryTime) fd.append('entryTime', data.entryTime);
  if (data.mood) fd.append('mood', data.mood);
  if (data.moodScore != null) fd.append('moodScore', String(data.moodScore));
  if (data.location) fd.append('location', data.location);
  data.removeMediaIds?.forEach((id) => fd.append('removeMediaIds', id));
  data.newImages?.forEach((file) => fd.append('newImages', file));
  data.tagIds?.forEach((id) => fd.append('tagIds', id));
  return fd;
}

// --- Hooks ---

export function useDiaryEntries(params?: DiaryQueryParams) {
  return useInfiniteQuery({
    queryKey: ['diary', 'list', params],
    queryFn: ({ pageParam }) =>
      apiGetPaginated<DiaryEntry>('/api/v1/diary', {
        params: { ...params, page: pageParam, limit: params?.limit ?? 20 },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
  });
}

export function useDiaryEntry(id: string) {
  return useQuery({
    queryKey: ['diary', 'detail', id],
    queryFn: () => apiGet<DiaryEntry>(`/api/v1/diary/${id}`),
    enabled: !!id,
  });
}

export function useCreateDiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDiaryInput) =>
      apiPost<DiaryEntry>('/api/v1/diary', buildCreateFormData(data), MULTIPART_CONFIG),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary'] });
    },
  });
}

export function useUpdateDiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDiaryInput }) =>
      apiPatch<DiaryEntry>(
        `/api/v1/diary/${id}`,
        buildUpdateFormData(data),
        MULTIPART_CONFIG,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary'] });
    },
  });
}

export function useDeleteDiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/api/v1/diary/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary'] });
    },
  });
}

export function useTogglePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPatch<DiaryEntry>(`/api/v1/diary/${id}/pin`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary'] });
    },
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPatch<DiaryEntry>(`/api/v1/diary/${id}/bookmark`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary'] });
    },
  });
}
