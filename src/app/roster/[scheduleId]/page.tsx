"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { getEnrollmentDeadline, isEnrollmentClosed } from "@/lib/enrollment";

type ScheduleInfo = {
  title: string;
  instructorName: string;
  locationId: string;
  locationName: string;
  startTime: Date;
  endTime: Date;
  note?: string;
};

type RosterRow = { enrollmentId: string; elderName: string; elderNotes: string };

function RosterContent() {
  const params = useParams();
  const scheduleId = params.scheduleId as string;
  const { role, siteId } = useAuth();

  const [schedule, setSchedule] = React.useState<ScheduleInfo | null>(null);
  const [rows, setRows] = React.useState<RosterRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!scheduleId || !role) return;

    async function load() {
      try {
        const snap = await getDoc(doc(db, "schedules", scheduleId));
        if (!snap.exists()) {
          setError("找不到這堂課程");
          return;
        }
        const data = snap.data();
        const info: ScheduleInfo = {
          title: data.title,
          instructorName: data.instructorName,
          locationId: data.locationId,
          locationName: data.locationName,
          startTime: (data.startTime as Timestamp).toDate(),
          endTime: (data.endTime as Timestamp).toDate(),
          note: data.note,
        };

        // 據點人員只能列印自己據點的點名單
        if (role === "staff" && info.locationId !== siteId) {
          setError("您沒有權限查看其他據點的點名單");
          return;
        }
        setSchedule(info);

        const q = query(
          collection(db, "enrollments"),
          where("scheduleId", "==", scheduleId),
          where("status", "==", "enrolled")
        );
        const enrollSnap = await getDocs(q);

        // 一併帶出長者資料裡的備註(例如行動需要輔助),方便現場人員留意
        const list = await Promise.all(
          enrollSnap.docs.map(async (d) => {
            const e = d.data();
            let elderNotes = "";
            try {
              const elderSnap = await getDoc(doc(db, "elders", e.elderId));
              if (elderSnap.exists()) elderNotes = elderSnap.data().notes ?? "";
            } catch {
              elderNotes = "";
            }
            return { enrollmentId: d.id, elderName: e.elderName, elderNotes };
          })
        );
        list.sort((a, b) => a.elderName.localeCompare(b.elderName, "zh-Hant"));
        setRows(list);
      } catch (err) {
        console.error("載入點名單失敗:", err);
        setError("載入失敗,請重新整理再試一次");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [scheduleId, role, siteId]);

  if (loading) {
    return <p className="p-10 text-center text-gray-400">載入中...</p>;
  }
  if (error || !schedule) {
    return <p className="p-10 text-center text-gray-500">{error || "找不到資料"}</p>;
  }

  const closed = isEnrollmentClosed(schedule.startTime);

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-3xl mx-auto p-8 print:p-0">
        {/* 這一列只在螢幕上顯示,列印時隱藏 */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <p className="text-sm text-gray-500">
            {closed
              ? "報名已截止,名單已確定。"
              : `尚未截止報名(${format(getEnrollmentDeadline(schedule.startTime), "MM/dd HH:mm")} 截止),名單仍可能變動。`}
          </p>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-white text-sm"
          >
            列印
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-1">課程點名單</h1>
        <p className="text-sm text-gray-500 mb-4">埔里基督教醫院 樂齡課程</p>

        <table className="w-full text-sm mb-6">
          <tbody>
            <tr>
              <td className="py-1 w-24 text-gray-500">課程名稱</td>
              <td className="py-1 font-medium">{schedule.title}</td>
              <td className="py-1 w-20 text-gray-500">授課講師</td>
              <td className="py-1">{schedule.instructorName}</td>
            </tr>
            <tr>
              <td className="py-1 text-gray-500">上課時間</td>
              <td className="py-1">
                {format(schedule.startTime, "yyyy/MM/dd(EEE) HH:mm", { locale: zhTW })} -{" "}
                {format(schedule.endTime, "HH:mm")}
              </td>
              <td className="py-1 text-gray-500">據點</td>
              <td className="py-1">{schedule.locationName}</td>
            </tr>
            {schedule.note && (
              <tr>
                <td className="py-1 text-gray-500">攜帶事項</td>
                <td className="py-1" colSpan={3}>
                  {schedule.note}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <table className="w-full text-sm border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-2 w-12">序號</th>
              <th className="border border-gray-400 px-2 py-2 w-32 text-left">長者姓名</th>
              <th className="border border-gray-400 px-2 py-2 text-left">備註</th>
              <th className="border border-gray-400 px-2 py-2 w-24">簽到</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-gray-400 px-2 py-6 text-center text-gray-400">
                  本堂課無長者報名
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.enrollmentId}>
                  <td className="border border-gray-400 px-2 py-3 text-center">{i + 1}</td>
                  <td className="border border-gray-400 px-2 py-3">{r.elderName}</td>
                  <td className="border border-gray-400 px-2 py-3 text-gray-600">{r.elderNotes}</td>
                  <td className="border border-gray-400 px-2 py-3"></td>
                </tr>
              ))
            )}
            {/* 預留幾列空白,給現場臨時加入的長者手寫 */}
            {[0, 1, 2].map((n) => (
              <tr key={`blank-${n}`}>
                <td className="border border-gray-400 px-2 py-3 text-center text-gray-300">
                  {rows.length + n + 1}
                </td>
                <td className="border border-gray-400 px-2 py-3"></td>
                <td className="border border-gray-400 px-2 py-3"></td>
                <td className="border border-gray-400 px-2 py-3"></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between text-sm mt-6">
          <span>報名人數:{rows.length} 位</span>
          <span>實到人數:________ 位</span>
          <span>點名人員簽名:______________</span>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          列印時間:{format(new Date(), "yyyy/MM/dd HH:mm")}
        </p>
      </div>
    </div>
  );
}

export default function RosterPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <RosterContent />
    </ProtectedRoute>
  );
}
