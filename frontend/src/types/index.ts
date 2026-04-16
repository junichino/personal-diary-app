export interface DiaryEntry {
  id: string;
  content: string;
  mood: string | null;
  moodScore: number | null;
  location: string | null;
  weather: string | null;
  temperature: number | null;
  isPinned: boolean;
  isBookmarked: boolean;
  entryDate: string; // YYYY-MM-DD
  entryTime: string; // HH:mm:ss
  createdAt: string;
  updatedAt: string;
  media: Media[];
  tags?: Tag[];
}

export interface Media {
  id: string;
  fileName: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  thumbnailPath: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  entryCount?: number;
}

export interface AppSettings {
  id: number;
  appName: string;
  timezone: string;
  darkMode: boolean;
  autoLockMinutes: number;
}

export interface AuthStatus {
  isSetup: boolean;
  isAuthenticated: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorData {
  success: false;
  error: {
    code: number;
    message: string;
  };
  timestamp: string;
}
