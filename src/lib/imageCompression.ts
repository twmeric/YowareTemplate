export interface CompressResult {
  isCompressed: boolean;
  file: File;
  originalSize: number;
  compressedSize: number;
  ratio: string;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 智慧型階梯式圖片壓縮
 * - ≤ 500 KB：不壓縮，保留原檔
 * - 500 KB ~ 2 MB：maxWidth 2048，品質 0.85
 * - 2 MB ~ 5 MB：maxWidth 1920，品質 0.75
 * - > 5 MB：maxWidth 1600，品質 0.65
 * - SVG / GIF 不壓縮
 * - 壓縮後若沒有變小，回退原檔
 */
export async function smartCompressImage(file: File): Promise<CompressResult> {
  if (
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif' ||
    file.size <= 500 * 1024
  ) {
    return {
      isCompressed: false,
      file,
      originalSize: file.size,
      compressedSize: file.size,
      ratio: '0%',
    };
  }

  const fileSizeKB = file.size / 1024;
  let maxWidth = 2560;
  let quality = 0.9;

  if (fileSizeKB > 5120) {
    maxWidth = 1600;
    quality = 0.65;
  } else if (fileSizeKB > 2048) {
    maxWidth = 1920;
    quality = 0.75;
  } else if (fileSizeKB > 500) {
    maxWidth = 2048;
    quality = 0.85;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          isCompressed: false,
          file,
          originalSize: file.size,
          compressedSize: file.size,
          ratio: '0%',
        });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const outputType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
      const ext = outputType === 'image/jpeg' ? 'jpg' : 'webp';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              isCompressed: false,
              file,
              originalSize: file.size,
              compressedSize: file.size,
              ratio: '0%',
            });
            return;
          }

          if (blob.size >= file.size) {
            resolve({
              isCompressed: false,
              file,
              originalSize: file.size,
              compressedSize: file.size,
              ratio: '0%',
            });
            return;
          }

          const originalName = file.name.replace(/\.[^.]+$/, '');
          const compressedFile = new File([blob], `${originalName}.${ext}`, {
            type: outputType,
            lastModified: Date.now(),
          });

          const ratio = (((file.size - blob.size) / file.size) * 100).toFixed(0);

          resolve({
            isCompressed: true,
            file: compressedFile,
            originalSize: file.size,
            compressedSize: blob.size,
            ratio: `${ratio}%`,
          });
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        isCompressed: false,
        file,
        originalSize: file.size,
        compressedSize: file.size,
        ratio: '0%',
      });
    };

    img.src = objectUrl;
  });
}
