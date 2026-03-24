"use client";

import { useCallback, useState } from "react";

interface MenuUploadProps {
  onAnalyze: (file: File) => void;
  loading: boolean;
}

export default function MenuUpload({ onAnalyze, loading }: MenuUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      onAnalyze(file);
    },
    [onAnalyze]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="w-full">
      <label
        className={`relative flex flex-col items-center justify-center w-full min-h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
        } ${loading ? "opacity-50 pointer-events-none" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          disabled={loading}
        />

        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Menu preview"
              className="max-h-64 rounded-xl object-contain"
            />
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-2xl">
                <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-3" />
                <p className="text-blue-600 font-medium">메뉴 분석 중...</p>
                <p className="text-gray-400 text-sm mt-1">AI가 메뉴를 읽고 있어요</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="text-5xl">📸</div>
            <div>
              <p className="text-gray-700 font-semibold text-lg">
                주간 메뉴표 사진을 올려주세요
              </p>
              <p className="text-gray-400 text-sm mt-1">
                클릭하거나 드래그해서 업로드
              </p>
            </div>
          </div>
        )}
      </label>
    </div>
  );
}
