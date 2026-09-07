"use client";

import * as React from "react";
import { format, isSameDay, isToday as checkIsToday } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

// 低飽和度的色盤,跟米色底色搭在一起不會太搶眼,公開頁面跟排班頁共用同一套
export const LOCATION_PALETTE = ["#C99B72", "#8FA888", "#A794B0", "#7FA3AE", "#C08A8A", "#A8A375"];

export function getLocationColor(locationId: string, locationIds: string[]) {
  const idx = locationIds.indexOf(locationId);
  return LOCATION_PALETTE[idx >= 0 ? idx % LOCATION_PALETTE.length : 0];
}

function buildMonthGrid(viewMonth: Date) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { date: Date; currentMonth: boolean }[] = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), currentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), currentMonth: true });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    cells.push({ date: next, currentMonth: false });
  }
  return cells;
}

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

interface MiniCalendarProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date) => void;
  // key 是 "yyyy-MM-dd",value 是那天要顯示的小底線顏色(通常對應不同據點)
  markersByDay: Map<string, string[]>;
}

export function MiniCalendar({ selectedDate, onSelectDate, markersByDay }: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = React.useState<Date>(selectedDate ?? new Date());

  function goToPrevMonth() {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }
  function goToNextMonth() {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  const gridCells = React.useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-gray-800 text-sm">
          {format(viewMonth, "yyyy年 MM月", { locale: zhTW })}
        </span>
        <button
          onClick={goToNextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400 transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="text-center text-xs text-gray-400 py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {gridCells.map(({ date: cellDate, currentMonth }, i) => {
          const key = format(cellDate, "yyyy-MM-dd");
          const dayColors = markersByDay.get(key) ?? [];
          const isSelected = selectedDate && isSameDay(cellDate, selectedDate);
          const isToday = checkIsToday(cellDate);

          return (
            <button
              key={i}
              onClick={() => onSelectDate(cellDate)}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-xl text-sm
                transition-all duration-150 ease-out
                ${!currentMonth ? "text-gray-300" : "text-gray-700"}
                ${
                  isSelected
                    ? "scale-110 shadow-md bg-white font-semibold z-10 relative"
                    : "hover:scale-105 hover:-translate-y-0.5 hover:bg-gray-50"
                }
                ${isToday && !isSelected ? "ring-1 ring-amber-300" : ""}
              `}
            >
              <span>{cellDate.getDate()}</span>
              {dayColors.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {dayColors.slice(0, 4).map((color, idx) => (
                    <span key={idx} className="w-2 h-[3px] rounded-full" style={{ backgroundColor: color }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
