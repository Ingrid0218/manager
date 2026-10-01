"use client";

import * as React from "react";
import Link from "next/link";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PublicHeader } from "@/components/public-header";
import { getLocationColor } from "@/components/mini-calendar";
import { isEnrollmentClosed } from "@/lib/enrollment";
import { format } from "date-fns";
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

const paths = [
  {
    title: "長輩與家屬",
    description: "幫家中長輩報名課程，查看上課時間、要帶的東西和上課紀錄。",
    actions: [
      { href: "/register/family", label: "註冊家屬帳號", primary: true },
      { href: "/login", label: "登入", primary: false },
    ],
  },
  {
    title: "講師",
    description: "線上送出履歷，審核通過後填寫空堂時間、查看自己的課表。",
    actions: [
      { href: "/register/instructor", label: "應徵講師", primary: true },
      { href: "/login", label: "登入", primary: false },
    ],
  },
  {
    title: "據點人員與行政",
    description: "排班、課前點名、出席確認與講師費用結算。",
    actions: [{ href: "/login", label: "登入後台", primary: true }],
  },
];

export default function HomePage() {
  const [locations, setLocations] = React.useState<LocationItem[]>([]);
  const [schedules, setSchedules] = React.useState<ScheduleItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [now, setNow] = React.useState<Date>(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "locations"), (snapshot) => {
      setLocations(snapshot.docs.map((d) => ({ id: d.id, name: d.data().name })));
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "schedules"), (snapshot) => {
      setSchedules(
        snapshot.docs.map((d) => {
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
        })
      );
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const locationIds = React.useMemo(() => locations.map((l) => l.id), [locations]);

  // 首頁只顯示最近 5 堂還沒開始、沒被取消的課
  const upcoming = React.useMemo(() => {
    return schedules
      .filter((s) => s.status === "scheduled" && s.startTime > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, 5);
  }, [schedules, now]);

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-gray-900">
      <PublicHeader />

      <main className="max-w-5xl mx-auto px-4">
        {/* 主視覺:左邊一句話說清楚這是什麼,右邊直接給最近的課 */}
        <section className="grid gap-10 md:grid-cols-[1.1fr_1fr] items-start py-12 md:py-16">
          <div className="md:pt-6">
            <p className="text-sm text-amber-700 font-medium mb-3">埔里基督教醫院 樂齡課程</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-5">
              這週去哪裡上課，
              <br />
              打開就知道。
            </h1>
            <p className="text-base text-gray-600 leading-relaxed max-w-md mb-8">
              埔基各長照據點的課程時間、地點和講師都在這裡，不用登入就能查看。家人也可以在線上幫長輩報名。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/course-calendar"
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-white font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
              >
                查看課程行事曆
              </Link>
              <Link
                href="/courses"
                className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
              >
                看看有哪些課
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold mb-4">接下來的課程</h2>
            {loading ? (
              <p className="text-sm text-gray-400 py-10 text-center">載入中...</p>
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-gray-500 py-10 text-center">
                近期還沒有排定的課程，可以先
                <Link href="/courses" className="text-amber-700 underline underline-offset-2 mx-1">
                  看看課程簡介
                </Link>
                。
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {upcoming.map((s) => (
                  <li key={s.id} className="flex items-center gap-4 py-3">
                    <div className="w-12 shrink-0 text-center">
                      <p className="text-2xl font-bold leading-none">{format(s.startTime, "d")}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(s.startTime, "M月 EEE", { locale: zhTW })}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{s.title}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <span>{format(s.startTime, "HH:mm")}</span>
                        <span
                          className="inline-block w-2 h-2 rounded-full ml-1"
                          style={{ backgroundColor: getLocationColor(s.locationId, locationIds) }}
                          aria-hidden="true"
                        />
                        <span className="truncate">{s.locationName}</span>
                      </p>
                    </div>
                    {isEnrollmentClosed(s.startTime, now) && (
                      <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        已截止報名
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/course-calendar"
              className="block text-center text-sm text-amber-700 hover:underline underline-offset-2 mt-3 pt-3 border-t border-gray-100"
            >
              查看完整行事曆
            </Link>
          </div>
        </section>

        {/* 三種使用者的入口 */}
        <section className="pb-16">
          <h2 className="text-lg font-semibold mb-4">從這裡開始</h2>
          <div className="bg-white rounded-2xl border border-gray-100 grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {paths.map((path) => (
              <div key={path.title} className="p-6 flex flex-col">
                <h3 className="font-semibold mb-2">{path.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-5 flex-1">{path.description}</p>
                <div className="flex flex-wrap gap-2">
                  {path.actions.map((a) => (
                    <Link
                      key={a.label}
                      href={a.href}
                      className={`px-4 py-2 rounded-lg text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 ${
                        a.primary
                          ? "bg-gray-900 text-white hover:bg-gray-700"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {a.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200">
        <p className="max-w-5xl mx-auto px-4 py-6 text-xs text-gray-400">
          埔里基督教醫院 長照據點樂齡課程
        </p>
      </footer>
    </div>
  );
}
