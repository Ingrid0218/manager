"use client";

import * as React from "react";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PublicHeader } from "@/components/public-header";
import { MiniCalendar, getLocationColor } from "@/components/mini-calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import { zhTW } from "date-fns/locale";

type LocationItem = { id: string; name: string };
type ScheduleItem = {
  id: string;
  title: string;
  instructorName: string;
  locationId: string;
  locationName: string;
  startTime: Date;
  endTime: Date;
  status: "scheduled" | "completed" | "cancelled";
};

function getPublicStatusBadge(s: ScheduleItem) {
  if (s.status === "cancelled") return { text: "已取消", variant: "destructive" as const };
  return null;
}

export default function CourseCalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [locationsData, setLocationsData] = React.useState<LocationItem[]>([]);
  const [schedules, setSchedules] = React.useState<ScheduleItem[]>([]);
  const [locationFilter, setLocationFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setDate(new Date());
  }, []);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "locations"), (snapshot) => {
      setLocationsData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as LocationItem)));
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "schedules"), (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          instructorName: data.instructorName,
          locationId: data.locationId,
          locationName: data.locationName,
          startTime: (data.startTime as Timestamp).toDate(),
          endTime: (data.endTime as Timestamp).toDate(),
          status: data.status,
        } as ScheduleItem;
      });
      setSchedules(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const locationIds = React.useMemo(() => locationsData.map((l) => l.id), [locationsData]);

  const scopedSchedules = React.useMemo(() => {
    return locationFilter === "all" ? schedules : schedules.filter((s) => s.locationId === locationFilter);
  }, [schedules, locationFilter]);

  const markersByDay = React.useMemo(() => {
    const map = new Map<string, string[]>();
    scopedSchedules.forEach((s) => {
      const key = format(s.startTime, "yyyy-MM-dd");
      const color = getLocationColor(s.locationId, locationIds);
      const existing = map.get(key) ?? [];
      if (!existing.includes(color)) existing.push(color);
      map.set(key, existing);
    });
    return map;
  }, [scopedSchedules, locationIds]);

  const dayList = React.useMemo(() => {
    return scopedSchedules
      .filter((s) => date && isSameDay(s.startTime, date))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [scopedSchedules, date]);

  return (
    <div className="min-h-screen bg-[#FAF7F0]">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">課程行事曆</h1>
        <p className="text-sm text-gray-500 mb-6">
          查詢各據點的課程時間,如遇臨時異動會即時更新於此。
        </p>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="選擇據點" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有據點</SelectItem>
              {locationsData.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {locationFilter === "all" && (
            <div className="flex items-center gap-3 flex-wrap">
              {locationsData.map((l) => (
                <div key={l.id} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getLocationColor(l.id, locationIds) }}
                  />
                  {l.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
            <MiniCalendar selectedDate={date} onSelectDate={setDate} markersByDay={markersByDay} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">
              {date ? format(date, "yyyy年MM月dd日", { locale: zhTW }) : "選擇日期"}
            </h2>
            {loading ? (
              <p className="text-sm text-gray-400 text-center py-8">載入中...</p>
            ) : dayList.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                {date ? "本日無課程安排" : "請選擇日期"}
              </p>
            ) : (
              <div className="space-y-3">
                {dayList.map((s) => {
                  const badge = getPublicStatusBadge(s);
                  return (
                    <div
                      key={s.id}
                      className={`p-3 rounded-lg border border-gray-100 ${
                        s.status === "cancelled" ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4
                          className={`font-medium text-sm ${
                            s.status === "cancelled" ? "line-through" : ""
                          }`}
                        >
                          {s.title}
                        </h4>
                        {badge && (
                          <Badge variant={badge.variant} className="shrink-0 text-xs">
                            {badge.text}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(s.startTime, "HH:mm")} - {format(s.endTime, "HH:mm")}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {s.instructorName}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {s.locationName}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
