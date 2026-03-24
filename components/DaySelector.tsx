"use client";

import { DayMenu } from "@/lib/types";

interface DaySelectorProps {
  days: DayMenu[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  todayIndex: number;
}

const DAY_COLORS = [
  "from-red-400 to-rose-500",
  "from-orange-400 to-amber-500",
  "from-green-400 to-emerald-500",
  "from-blue-400 to-cyan-500",
  "from-purple-400 to-violet-500",
];

export default function DaySelector({
  days,
  selectedIndex,
  onSelect,
  todayIndex,
}: DaySelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {days.map((day, index) => {
        const isSelected = selectedIndex === index;
        const isToday = todayIndex === index;

        return (
          <button
            key={day.date}
            onClick={() => onSelect(index)}
            className={`relative flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl transition-all duration-200 ${
              isSelected
                ? `bg-gradient-to-br ${DAY_COLORS[index]} text-white shadow-lg scale-105`
                : "bg-white text-gray-600 hover:bg-gray-50 shadow border border-gray-100"
            }`}
          >
            {isToday && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            )}
            <span
              className={`text-xs font-medium ${isSelected ? "text-white/80" : "text-gray-400"}`}
            >
              {day.dayName}
            </span>
            <span className="text-lg font-bold">{day.dayLabel}</span>
            <span
              className={`text-xs mt-0.5 ${isSelected ? "text-white/80" : "text-gray-400"}`}
            >
              {day.date.slice(5).replace("-", "/")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
