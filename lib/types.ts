export interface DayMenu {
  date: string; // YYYY-MM-DD
  dayName: string; // MON, TUE, ...
  dayLabel: string; // 월, 화, ...
  breakfast: string[];
  lunch: string[];
}

export interface WeeklyMenu {
  week: string;
  days: DayMenu[];
}
