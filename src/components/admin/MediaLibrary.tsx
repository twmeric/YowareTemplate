import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Trash2, ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { listMedia, uploadMedia, deleteMedia, type MediaObject } from "../../api/media";
import { smartCompressImage, formatSize } from "../../lib/imageCompression";
import { AdminAPIError } from "../../api/admin";

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({ isOpen, onClose, onSelect }) => {
  const [media, setMedia] = useState<MediaObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [compressInfo, setCompressInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const objects = await listMedia();
      setMedia(objects.sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime()));
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof AdminAPIError ? err.message : "載入媒體庫失敗",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setCompressInfo(null);
    setMessage(null);

    try {
      for (const file of Array.from(files)) {
        let uploadFile = file;

        if (file.type.startsWith("image/")) {
          try {
            const result = await smartCompressImage(file);
            uploadFile = result.file;
            if (result.isCompressed) {
              setCompressInfo(
                `已壓縮 ${result.ratio}（${formatSize(result.originalSize)} → ${formatSize(result.compressedSize)}）`
              );
            }
          } catch {
            uploadFile = file;
          }
        }

        await uploadMedia(uploadFile);
      }

      setMessage({ type: "success", text: "上傳成功" });
      await loadMedia();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof AdminAPIError ? err.message : "上傳失敗",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm("確定刪除這張圖片？")) return;
    try {
      await deleteMedia(key);
      setMessage({ type: "success", text: "刪除成功" });
      await loadMedia();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof AdminAPIError ? err.message : "刪除失敗",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-brand-green flex items-center gap-2">
            <ImageIcon className="w-5 h-5" /> 媒體庫
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
              message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
          >
            {message.type === "error" ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {/* Upload area */}
        <div className="p-4 border-b border-gray-100">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-brand-green hover:text-brand-green transition-colors flex flex-col items-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>上傳並壓縮中...</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span>點擊上傳圖片</span>
                <span className="text-xs text-gray-400">自動壓縮大圖，支援 JPG / PNG / WebP / GIF</span>
              </>
            )}
          </button>
          {compressInfo && <p className="mt-2 text-sm text-green-600 text-center">{compressInfo}</p>}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>尚無圖片</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {media.map((item) => (
                <div
                  key={item.key}
                  className="group relative bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:border-brand-green transition-colors"
                >
                  <img
                    src={item.url}
                    alt={item.key}
                    className="w-full h-32 object-cover cursor-pointer"
                    onClick={() => {
                      onSelect(item.url);
                      onClose();
                    }}
                  />
                  <div className="p-2">
                    <p className="text-xs text-gray-500 truncate">{item.key}</p>
                    <p className="text-xs text-gray-400">{formatSize(item.size)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.key)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaLibrary;
