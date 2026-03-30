"use client";

import React, { useState, useEffect } from "react";
import MenuUpload from "@/components/MenuUpload";
import { WeeklyMenu, DayMenu } from "@/lib/types";

function MenuEditor({
  menu,
  onSaved,
}: {
  menu: WeeklyMenu;
  onSaved: (menu: WeeklyMenu) => void;
}) {
  const [editMenu, setEditMenu] = useState<WeeklyMenu>(menu);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  // 항목 텍스트 수정
  const updateItem = (
    dayIdx: number,
    meal: "breakfast" | "lunch",
    itemIdx: number,
    value: string
  ) => {
    setEditMenu((prev: WeeklyMenu) => {
      const days = prev.days.map((d: DayMenu, di: number) => {
        if (di !== dayIdx) return d;
        const items = [...d[meal]];
        items[itemIdx] = value;
        return { ...d, [meal]: items };
      });
      return { ...prev, days };
    });
    setSavedOk(false);
  };

  // 항목 삭제
  const removeItem = (dayIdx: number, meal: "breakfast" | "lunch", itemIdx: number) => {
    setEditMenu((prev: WeeklyMenu) => {
      const days = prev.days.map((d: DayMenu, di: number) => {
        if (di !== dayIdx) return d;
        const items = d[meal].filter((_: string, i: number) => i !== itemIdx);
        return { ...d, [meal]: items };
      });
      return { ...prev, days };
    });
    setSavedOk(false);
  };

  // 항목 추가
  const addItem = (dayIdx: number, meal: "breakfast" | "lunch") => {
    setEditMenu((prev: WeeklyMenu) => {
      const days = prev.days.map((d: DayMenu, di: number) => {
        if (di !== dayIdx) return d;
        return { ...d, [meal]: [...d[meal], ""] };
      });
      return { ...prev, days };
    });
    setSavedOk(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSavedOk(false);
    try {
      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editMenu),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "저장 실패");
      }
      const saved: WeeklyMenu = await res.json();
      setSavedOk(true);
      onSaved(saved);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setSaving(false);
    }
  };

  const mealLabel = (meal: "breakfast" | "lunch") =>
    meal === "breakfast" ? "아침" : "점심";

  return (
    <section className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-700">메뉴 편집</p>
          <p className="text-xs text-gray-400">{editMenu.week}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>

      {saveError && <p className="text-red-500 text-xs">{saveError}</p>}
      {savedOk && <p className="text-green-600 text-xs font-medium">✅ 저장되었습니다</p>}

      {editMenu.days.map((day, dayIdx) => (
        <DayEditor
          key={day.date}
          day={day}
          dayIdx={dayIdx}
          mealLabel={mealLabel}
          onUpdateItem={updateItem}
          onRemoveItem={removeItem}
          onAddItem={addItem}
        />
      ))}
    </section>
  );
}

function DayEditor({
  day,
  dayIdx,
  mealLabel,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
}: {
  day: DayMenu;
  dayIdx: number;
  mealLabel: (meal: "breakfast" | "lunch") => string;
  onUpdateItem: (di: number, meal: "breakfast" | "lunch", ii: number, v: string) => void;
  onRemoveItem: (di: number, meal: "breakfast" | "lunch", ii: number) => void;
  onAddItem: (di: number, meal: "breakfast" | "lunch") => void;
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-3 space-y-3">
      <p className="text-sm font-semibold text-gray-600">
        {day.dayLabel}요일{" "}
        <span className="text-xs font-normal text-gray-400">{day.date}</span>
      </p>
      {(["breakfast", "lunch"] as const).map((meal) => (
        <div key={meal}>
          <p className="text-xs text-gray-400 mb-1">{mealLabel(meal)}</p>
          {day[meal].length === 0 && (
            <p className="text-xs text-gray-300 italic mb-1">메뉴 없음</p>
          )}
          <div className="space-y-1">
            {day[meal].map((item, itemIdx) => (
              <div key={itemIdx} className="flex items-center gap-1">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => onUpdateItem(dayIdx, meal, itemIdx, e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
                <button
                  onClick={() => onRemoveItem(dayIdx, meal, itemIdx)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none px-1"
                  aria-label="삭제"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => onAddItem(dayIdx, meal)}
            className="mt-1 text-xs text-blue-400 hover:text-blue-600 transition-colors"
          >
            + 항목 추가
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedMenu, setSavedMenu] = useState<WeeklyMenu | null>(null);
  const [stats, setStats] = useState<{ today: number; total: number } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setLoggedIn(true);
    } else {
      const data = await res.json();
      setLoginError(data.error ?? "로그인 실패");
    }
  };

  useEffect(() => {
    if (!loggedIn) return;
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => setStats(data));
  }, [loggedIn]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false);
    setSavedMenu(null);
    setStats(null);
  };

  const handleAnalyze = async (file: File) => {
    setLoading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/analyze-menu", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "분석 실패");
      }
      const data: WeeklyMenu = await res.json();
      setSavedMenu(data);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setLoading(false);
    }
  };

  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <span className="text-4xl">🔐</span>
            <h1 className="text-xl font-bold text-gray-800 mt-2">관리자 로그인</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              autoFocus
            />
            {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
            >
              로그인
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-3xl">🔧</span>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">관리자 페이지</h1>
            <p className="text-xs text-gray-400">주간 메뉴표 업로드</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 방문자 통계 */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">오늘 방문자</p>
            <p className="text-3xl font-bold text-blue-500">
              {stats ? stats.today.toLocaleString() : "—"}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">누적 방문자</p>
            <p className="text-3xl font-bold text-gray-700">
              {stats ? stats.total.toLocaleString() : "—"}
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-4">
            새 주간 메뉴표 사진을 업로드하면 모든 사용자에게 적용됩니다.
          </p>
          <MenuUpload onAnalyze={handleAnalyze} loading={loading} />
          {uploadError && (
            <p className="mt-3 text-red-500 text-sm text-center">{uploadError}</p>
          )}
        </section>

        {savedMenu && (
          <MenuEditor
            menu={savedMenu}
            onSaved={(updated) => setSavedMenu(updated)}
          />
        )}

        <div className="text-center">
          <a href="/" className="text-sm text-blue-500 hover:underline">
            ← 일반 사용자 페이지로 이동
          </a>
        </div>
      </div>
    </main>
  );
}
