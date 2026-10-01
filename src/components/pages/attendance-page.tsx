"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { getEnrollmentDeadline, isEnrollmentClosed } from "@/lib/enrollment";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";

type ScheduleItem = {
  id: string;
  title: string;
  instructorName: string;
  locationId: string;
  locationName: string;
  startTime: Date;
  endTime: Date;
  status: "scheduled" | "completed" | "cancelled";
  attendeeCount?: number;
  cancelReason?: "instructor_absent" | "other";
  instructorReport?: string;
  improvementNote?: string;
};

type EnrollmentItem = {
  id: string;
  scheduleId: string;
  elderName: string;
  status: string;
  reaction?: "happy" | "neutral" | "sad";
  attended?: boolean;
};

const REACTIONS: { key: "happy" | "neutral" | "sad"; emoji: string }[] = [
  { key: "happy", emoji: "😊" },
  { key: "neutral", emoji: "😐" },
  { key: "sad", emoji: "😞" },
];

function getStatusLabel(s: ScheduleItem) {
  if (s.status === "scheduled") return "待確認";
  if (s.status === "completed") return "已完成";
  if (s.status === "cancelled") {
    return s.cancelReason === "instructor_absent" ? "講師未到" : "已取消";
  }
  return s.status;
}

export function AttendancePage() {
  const { role, siteId, user } = useAuth();
  const [schedules, setSchedules] = React.useState<ScheduleItem[]>([]);
  const [enrollments, setEnrollments] = React.useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("scheduled");
  const [attendeeInputs, setAttendeeInputs] = React.useState<Record<string, string>>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const canOperate = role === "staff";

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
          attendeeCount: data.attendeeCount,
          cancelReason: data.cancelReason,
          instructorReport: data.instructorReport,
          improvementNote: data.improvementNote,
        } as ScheduleItem;
      });
      setSchedules(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "enrollments"), (snapshot) => {
      const list = snapshot.docs
        .map((d) => ({
          id: d.id,
          scheduleId: d.data().scheduleId,
          elderName: d.data().elderName,
          status: d.data().status,
          reaction: d.data().reaction,
          attended: d.data().attended,
        }))
        .filter((e) => e.status === "enrolled");
      setEnrollments(list);
    });
    return () => unsubscribe();
  }, []);

  const scopedSchedules = React.useMemo(() => {
    const base = role === "admin" ? schedules : schedules.filter((s) => s.locationId === siteId);
    return [...base]
      .filter((s) => statusFilter === "all" || s.status === statusFilter)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [schedules, role, siteId, statusFilter]);

  function enrollmentsFor(scheduleId: string) {
    return enrollments.filter((e) => e.scheduleId === scheduleId);
  }

  async function handleSetReaction(enrollmentId: string, reaction: "happy" | "neutral" | "sad") {
    try {
      await updateDoc(doc(db, "enrollments", enrollmentId), {
        reaction,
        reactionRecordedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error("記錄反應失敗:", err);
      alert("操作失敗,請再試一次");
    }
  }

  async function handleToggleAttended(enrollmentId: string, attended: boolean) {
    try {
      await updateDoc(doc(db, "enrollments", enrollmentId), {
        attended,
        attendanceMarkedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error("點名失敗:", err);
      alert("操作失敗,請再試一次");
    }
  }

  async function handleConfirm(scheduleId: string) {
    const countStr = attendeeInputs[scheduleId];
    // 沒有手動輸入人數時,自動帶入點名勾選的人數
    const checkedCount = enrollmentsFor(scheduleId).filter((e) => e.attended).length;
    const count = countStr ? Number(countStr) : checkedCount;
    setSavingId(scheduleId);
    try {
      await updateDoc(doc(db, "schedules", scheduleId), {
        status: "completed",
        attendeeCount: count,
        confirmedAt: Timestamp.now(),
        confirmedBy: user?.email ?? null,
      });
    } catch (err) {
      console.error("確認出席失敗:", err);
      alert("更新失敗,請再試一次");
    } finally {
      setSavingId(null);
    }
  }

  async function handleCancel(scheduleId: string, reason: "instructor_absent" | "other") {
    setSavingId(scheduleId);
    try {
      await updateDoc(doc(db, "schedules", scheduleId), {
        status: "cancelled",
        cancelReason: reason,
        confirmedAt: Timestamp.now(),
        confirmedBy: user?.email ?? null,
      });
    } catch (err) {
      console.error("更新失敗:", err);
      alert("更新失敗,請再試一次");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">出席確認</h1>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">待確認</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="cancelled">已取消/講師未到</SelectItem>
              <SelectItem value="all">全部</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{role === "admin" ? "所有據點課程(唯讀)" : "本據點課程"}</CardTitle>
            <CardDescription>
              {role === "admin"
                ? "掌握全據點的出席確認狀況與講師課後回報,實際確認由各據點承辦人操作。"
                : "報名於上課前一天中午 12:00 截止,截止後可列印點名單,並於現場勾選實際到場的長者;下課後可順口問問長者今天上課感覺如何,幫忙點選反應。"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">載入中...</p>
            ) : scopedSchedules.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">目前沒有符合的課程</p>
            ) : (
              <div className="space-y-3">
                {scopedSchedules.map((s) => {
                  const scheduleEnrollments = enrollmentsFor(s.id);
                  return (
                    <div key={s.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{s.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(s.startTime, "yyyy/MM/dd HH:mm")} - {format(s.endTime, "HH:mm")}
                          </p>
                        </div>
                        <Badge
                          variant={
                            s.status === "completed"
                              ? "default"
                              : s.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {getStatusLabel(s)}
                        </Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap text-sm">
                        <Badge variant="outline">{s.instructorName}</Badge>
                        {role === "admin" && <Badge variant="outline">{s.locationName}</Badge>}
                        {s.attendeeCount !== undefined && (
                          <Badge variant="outline">到場 {s.attendeeCount} 人</Badge>
                        )}
                      </div>

                      {(() => {
                        const closed = isEnrollmentClosed(s.startTime);
                        const attendedCount = scheduleEnrollments.filter((e) => e.attended).length;

                        // 尚未截止:名單還會變動,只顯示目前人數,不開放點名
                        if (!closed) {
                          return (
                            <div className="text-sm bg-muted/50 rounded-lg p-2 flex items-center justify-between flex-wrap gap-2">
                              <span className="text-muted-foreground text-xs">
                                報名中 · 目前 {scheduleEnrollments.length} 位 · 截止於{" "}
                                {format(getEnrollmentDeadline(s.startTime), "MM/dd HH:mm")}
                              </span>
                            </div>
                          );
                        }

                        // 已截止:名單確定,可列印點名單、勾選點名、記錄反應
                        return (
                          <div className="text-sm bg-muted/50 rounded-lg p-2 space-y-1.5">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p className="text-muted-foreground text-xs">
                                報名已截止 · 確定名單 {scheduleEnrollments.length} 位
                                {scheduleEnrollments.length > 0 && ` · 已點名 ${attendedCount} 位`}
                              </p>
                              {scheduleEnrollments.length > 0 && (
                                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                                  <Link href={`/roster/${s.id}`} target="_blank">
                                    列印點名單
                                  </Link>
                                </Button>
                              )}
                            </div>
                            {scheduleEnrollments.length === 0 ? (
                              <p className="text-xs text-muted-foreground">本堂課無長者報名</p>
                            ) : (
                              scheduleEnrollments.map((e) => (
                                <div key={e.id} className="flex items-center justify-between gap-2">
                                  <label className="flex items-center gap-2">
                                    <Checkbox
                                      checked={!!e.attended}
                                      disabled={!canOperate}
                                      onCheckedChange={(v) => handleToggleAttended(e.id, v === true)}
                                    />
                                    <span>{e.elderName}</span>
                                  </label>
                                  <div className="flex gap-1.5">
                                    {REACTIONS.map((r) => (
                                      <button
                                        key={r.key}
                                        type="button"
                                        disabled={!canOperate}
                                        onClick={() => handleSetReaction(e.id, r.key)}
                                        className={`text-lg transition ${
                                          e.reaction === r.key ? "opacity-100 scale-125" : "opacity-30"
                                        } ${canOperate ? "cursor-pointer hover:opacity-70" : "cursor-default"}`}
                                      >
                                        {r.emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })()}

                      {(s.instructorReport || s.improvementNote) && (
                        <div className="text-sm space-y-1.5 border-t pt-2">
                          {s.instructorReport && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">講師回報:上課內容與長者狀況</p>
                              <p className="bg-amber-50 border border-amber-100 rounded-lg p-2">{s.instructorReport}</p>
                            </div>
                          )}
                          {s.improvementNote && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">講師回報:課程改進建議</p>
                              <p className="bg-amber-50 border border-amber-100 rounded-lg p-2">{s.improvementNote}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {canOperate && s.status === "scheduled" && (
                        <div className="flex items-center gap-2 pt-2 border-t mt-2 flex-wrap">
                          <Input
                            type="number"
                            placeholder={`到場人數(預設 ${scheduleEnrollments.filter((e) => e.attended).length})`}
                            className="w-44"
                            value={attendeeInputs[s.id] ?? ""}
                            onChange={(e) =>
                              setAttendeeInputs((prev) => ({ ...prev, [s.id]: e.target.value }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={savingId === s.id}
                            onClick={() => handleCancel(s.id, "instructor_absent")}
                          >
                            講師未到
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={savingId === s.id}
                            onClick={() => handleCancel(s.id, "other")}
                          >
                            取消課程
                          </Button>
                          <Button size="sm" disabled={savingId === s.id} onClick={() => handleConfirm(s.id)}>
                            確認出席
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
