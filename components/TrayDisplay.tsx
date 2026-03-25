"use client";

import { useEffect, useState } from "react";

interface TrayDisplayProps {
  dishes: string[];
  mealType: "breakfast" | "lunch";
}

interface DishWithImage {
  name: string;
  imageUrls: string[];
  loading: boolean;
}

const TRAY_COLORS = {
  breakfast: {
    bg: "from-orange-50 to-amber-50",
    tray: "#F5E6D0",
    compartment: "#E8D5B7",
    border: "#C4A882",
    title: "text-orange-700",
    badge: "bg-orange-100 text-orange-700",
  },
  lunch: {
    bg: "from-blue-50 to-cyan-50",
    tray: "#D0E8F5",
    compartment: "#B7D5E8",
    border: "#82A8C4",
    title: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
  },
};

export default function TrayDisplay({ dishes, mealType }: TrayDisplayProps) {
  const [dishImages, setDishImages] = useState<DishWithImage[]>([]);
  const colors = TRAY_COLORS[mealType];

  useEffect(() => {
    if (dishes.length === 0) return;

    const initial = dishes.map((name) => ({
      name,
      imageUrls: [],
      loading: true,
    }));
    setDishImages(initial);

    dishes.forEach((dish, index) => {
      fetch(`/api/food-image?q=${encodeURIComponent(dish)}`)
        .then((r) => r.json())
        .then((data) => {
          setDishImages((prev) => {
            const next = [...prev];
            next[index] = { name: dish, imageUrls: data.urls ?? [], loading: false };
            return next;
          });
        })
        .catch(() => {
          setDishImages((prev) => {
            const next = [...prev];
            next[index] = { name: dish, imageUrls: [], loading: false };
            return next;
          });
        });
    });
  }, [dishes]);

  if (dishes.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        메뉴 없음
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br ${colors.bg} rounded-2xl p-4`}>
      {/* Tray container */}
      <div
        className="relative rounded-xl p-4 shadow-inner"
        style={{ backgroundColor: colors.tray }}
      >
        {/* Tray rim effect */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            boxShadow: `inset 0 2px 8px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)`,
            border: `3px solid ${colors.border}`,
          }}
        />

        {/* Dishes grid */}
        <div className="relative grid grid-cols-3 gap-3">
          {dishImages.map((dish, i) => (
            <DishCell key={`${dish.name}-${i}`} dish={dish} colors={colors} index={i} />
          ))}
          {/* Empty slots to fill the grid nicely */}
          {dishImages.length % 3 !== 0 &&
            Array.from({ length: 3 - (dishImages.length % 3) }).map((_, i) => (
              <div key={`empty-${i}`} className="rounded-lg" style={{ backgroundColor: colors.compartment, opacity: 0.4, minHeight: 80 }} />
            ))}
        </div>
      </div>
    </div>
  );
}

interface DishCellProps {
  dish: DishWithImage;
  colors: (typeof TRAY_COLORS)["breakfast"];
  index: number;
}

function DishCell({ dish, colors }: DishCellProps) {
  const [urlIndex, setUrlIndex] = useState(0);

  const currentUrl = dish.imageUrls[urlIndex] ?? null;

  return (
    <div
      className="rounded-lg overflow-hidden flex flex-col"
      style={{
        backgroundColor: colors.compartment,
        border: `1.5px solid ${colors.border}`,
        boxShadow: `inset 0 1px 3px rgba(0,0,0,0.1)`,
      }}
    >
      {/* 사진 영역 */}
      <div className="relative w-full" style={{ height: 80 }}>
        {dish.loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
          </div>
        ) : currentUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={currentUrl}
            alt={dish.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setUrlIndex((i) => i + 1)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">🍽️</span>
          </div>
        )}
      </div>

      {/* 텍스트 영역 */}
      <div
        className="w-full px-1.5 py-1.5 text-center"
        style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
      >
        <span
          className="text-xs font-semibold leading-tight line-clamp-2 block"
          style={{ color: "#3D2B1A" }}
        >
          {dish.name}
        </span>
      </div>
    </div>
  );
}
