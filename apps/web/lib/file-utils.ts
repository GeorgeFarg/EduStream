export function getFileIcon(type: string): string {
  const fileType = type.toLowerCase();
  
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('sheet') || fileType.includes('csv')) return '📊';
  if (fileType.includes('video') || fileType.includes('mp4')) return '🎥';
  if (fileType.includes('audio') || fileType.includes('mp3')) return '🎵';
  if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('png')) return '🖼️';
  if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
  if (fileType.includes('presentation') || fileType.includes('ppt')) return '📽️';
  
  return '📎';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}
