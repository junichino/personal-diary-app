const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function getMediaUrl(storedName: string): string {
  return `${API_URL}/api/v1/media/${storedName}`;
}

export function getThumbnailUrl(storedName: string): string {
  return `${API_URL}/api/v1/media/thumb/${storedName}`;
}
