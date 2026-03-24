"use client";

import { useState, useCallback, useEffect } from "react";
import TrayDisplay from "@/components/TrayDisplay";
import DaySelector from "@/components/DaySelector";
import { WeeklyMenu, DayMenu } from "@/lib/types";

export default function Home() {
  const [menu, setMenu] = useState<WeeklyMenu | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [todayIndex, setTodayIndex] = useState(-1);

  const findTodayIndex = useCallback((days: DayMenu[]) => {
    const today = new Date().toISOString().slice(0, 10);
    return days.findIndex((d) => d.date === today);
  }, []);

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: WeeklyMenu) => {
        setMenu(data);
        const idx = findTodayIndex(data.days);
        setTodayIndex(idx);
        setSelectedDayIndex(idx >= 0 ? idx : 0);
      })
      .catch(() => setFetchError(true));
  }, [findTodayIndex]);

  const selectedDay = menu?.days[selectedDayIndex];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-3xl">🍱</span>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">오늘의 급식</h1>
            <p className="text-xs text-gray-400">주간 메뉴표 분석기</p>
          </div>
          <a
            href="/admin"
            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            관리자
          </a>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 메뉴 미등록 상태 */}
        {fetchError && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-sm">아직 등록된 메뉴가 없습니다</p>
            <p className="text-xs mt-1">관리자에게 문의하세요</p>
          </div>
        )}

        {/* 로딩 */}
        {!menu && !fetchError && (
          <div className="text-center py-16 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">메뉴 불러오는 중...</p>
          </div>
        )}

        {/* 메뉴 표시 */}
        {menu && selectedDay && (
          <>
            <div className="text-center">
              <p className="text-sm text-gray-400">{menu.week}</p>
            </div>

            <DaySelector
              days={menu.days}
              selectedIndex={selectedDayIndex}
              onSelect={setSelectedDayIndex}
              todayIndex={todayIndex}
            />

            {/* Breakfast */}
            <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                <span className="text-xl">🌅</span>
                <h2 className="text-base font-bold text-orange-700">아침 식사</h2>
                <span className="ml-auto text-xs text-gray-400">건강생각아침</span>
              </div>
              <div className="px-4 pb-4">
                {selectedDay.breakfast.length > 0 ? (
                  <TrayDisplay dishes={selectedDay.breakfast} mealType="breakfast" />
                ) : (
                  <div className="flex items-center justify-center h-24 text-gray-400 text-sm bg-gray-50 rounded-xl">
                    오늘은 아침 메뉴가 없습니다
                  </div>
                )}
              </div>
            </section>

            {/* Lunch */}
            <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                <span className="text-xl">☀️</span>
                <h2 className="text-base font-bold text-blue-700">점심 식사</h2>
                <span className="ml-auto text-xs text-gray-400">정성가득점심</span>
              </div>
              <div className="px-4 pb-4">
                {selectedDay.lunch.length > 0 ? (
                  <TrayDisplay dishes={selectedDay.lunch} mealType="lunch" />
                ) : (
                  <div className="flex items-center justify-center h-24 text-gray-400 text-sm bg-gray-50 rounded-xl">
                    오늘은 점심 메뉴가 없습니다
                  </div>
                )}
              </div>
            </section>

            {/* Text list */}
            <section className="bg-white/60 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-600">전체 메뉴</h3>
              {selectedDay.breakfast.length > 0 && (
                <div>
                  <p className="text-xs text-orange-500 font-medium mb-1">🌅 아침</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDay.breakfast.map((dish, i) => (
                      <span key={i} className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-100">
                        {dish}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedDay.lunch.length > 0 && (
                <div>
                  <p className="text-xs text-blue-500 font-medium mb-1">☀️ 점심</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDay.lunch.map((dish, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                        {dish}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
