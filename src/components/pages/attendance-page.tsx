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
};

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
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("scheduled");
  const [attendeeInputs, setAttendeeInputs] = React.useState<Record<string, string>>({});
  const [savingId, setSavingId] = React.useState<string | null>(null);

  // 只有 staff 能實際操作出席確認,admin 這裡是唯讀,用來掌握全據點狀況
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
        } as ScheduleItem;
      });
      setSchedules(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const scopedSchedules = React.useMemo(() => {
    const base = role === "admin" ? schedules : schedules.filter((s) => s.locationId === siteId);
    return [...base]
      .filter((s) => statusFilter === "all" || s.status === statusFilter)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [schedules, role, siteId, statusFilter]);

  async function handleConfirm(scheduleId: string) {
    const countStr = attendeeInputs[scheduleId];
    const count = countStr ? Number(countStr) : 0;
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
                ? "掌握全據點的出席確認狀況,實際確認由各據點承辦人操作。"
                : "確認講師是否實際到場授課,並記錄本次到場學員人數。"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">載入中...</p>
            ) : scopedSchedules.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">目前沒有符合的課程</p>
            ) : (
              <div className="space-y-3">
                {scopedSchedules.map((s) => (
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

                    {canOperate && s.status === "scheduled" && (
                      <div className="flex items-center gap-2 pt-2 border-t mt-2 flex-wrap">
                        <Input
                          type="number"
                          placeholder="到場人數"
                          className="w-28"
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
