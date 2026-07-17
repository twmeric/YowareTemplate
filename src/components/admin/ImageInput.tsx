import React, { useState } from "react";
import { ImageIcon, X } from "lucide-react";
import MediaLibrary from "./MediaLibrary";

interface ImageInputProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

const ImageInput: React.FC<ImageInputProps> = ({ value, onChange, placeholder = "圖片 URL" }) => {
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setIsMediaOpen(true)}
          className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
        >
          <ImageIcon className="w-4 h-4" />
          媒體庫
        </button>
      </div>
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="h-24 w-auto object-contain border border-gray-200 rounded-lg p-1"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <MediaLibrary isOpen={isMediaOpen} onClose={() => setIsMediaOpen(false)} onSelect={onChange} />
    </div>
  );
};

export default ImageInput;
