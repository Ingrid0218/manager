"use client";

import * as React from "react";
import { collection, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

type ScheduleItem = {
  id: string;
  title: string;
  locationName: string;
  startTime: Date;
  endTime: Date;
  status: "scheduled" | "completed" | "cancelled";
  cancelReason?: "instructor_absent" | "other";
  instructorReport?: string;
  instructorReportedAt?: Date;
};

function getStatusBadge(s: ScheduleItem) {
  if (s.status === "completed") return { text: "已完成", variant: "default" as const };
  if (s.status === "cancelled") {
    return s.cancelReason === "instructor_absent"
      ? { text: "講師未到", variant: "destructive" as const }
      : { text: "已取消", variant: "destructive" as const };
  }
  return { text: "待上課", variant: "secondary" as const };
}

export function MySchedulePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = React.useState<ScheduleItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("upcoming");

  const [reportingSchedule, setReportingSchedule] = React.useState<ScheduleItem | null>(null);
  const [reportText, setReportText] = React.useState("");
  const [submittingReport, setSubmittingReport] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "schedules"), (snapshot) => {
      const list = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title,
            instructorId: data.instructorId,
            locationName: data.locationName,
            startTime: (data.startTime as Timestamp).toDate(),
            endTime: (data.endTime as Timestamp).toDate(),
            status: data.status,
            cancelReason: data.cancelReason,
            instructorReport: data.instructorReport,
            instructorReportedAt: data.instructorReportedAt
              ? (data.instructorReportedAt as Timestamp).toDate()
              : undefined,
          };
        })
        .filter((s: any) => user && s.instructorId === user.uid) as ScheduleItem[];
      setSchedules(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredSchedules = React.useMemo(() => {
    const now = new Date();
    return [...schedules]
      .filter((s) => {
        if (filter === "upcoming") return s.status === "scheduled" && s.startTime >= now;
        if (filter === "past") return s.startTime < now || s.status !== "scheduled";
        return true;
      })
      .sort((a, b) =>
        filter === "past" ? b.startTime.getTime() - a.startTime.getTime() : a.startTime.getTime() - b.startTime.getTime()
      );
  }, [schedules, filter]);

  function openReportDialog(s: ScheduleItem) {
    setReportingSchedule(s);
    setReportText(s.instructorReport ?? "");
  }

  async function handleSubmitReport() {
    if (!reportingSchedule) return;
    setSubmittingReport(true);
    try {
      await updateDoc(doc(db, "schedules", reportingSchedule.id), {
        instructorReport: reportText,
        instructorReportedAt: Timestamp.now(),
      });
      setReportingSchedule(null);
    } catch (err) {
      console.error("送出簽退回報失敗:", err);
      alert("送出失敗,請再試一次");
    } finally {
      setSubmittingReport(false);
    }
  }

  const now = new Date();

  return (
    <ProtectedRoute allowedRoles={["instructor"]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">我的課表</h1>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">即將到來</SelectItem>
              <SelectItem value="past">歷史紀錄</SelectItem>
              <SelectItem value="all">全部</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>排定課程</CardTitle>
            <CardDescription>
              行政端已為您排定的課程時間與地點。已結束的課程可以填寫簽退回報。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">載入中...</p>
            ) : filteredSchedules.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">目前沒有符合的課程</p>
            ) : (
              <div className="space-y-3">
                {filteredSchedules.map((s) => {
                  const badge = getStatusBadge(s);
                  const isPast = s.startTime < now;
                  return (
                    <div key={s.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{s.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(s.startTime, "yyyy/MM/dd(EEE) HH:mm", { locale: zhTW })} - {format(s.endTime, "HH:mm")}
                          </p>
                        </div>
                        <Badge variant={badge.variant}>{badge.text}</Badge>
                      </div>
                      <Badge variant="outline">{s.locationName}</Badge>

                      {isPast && (
                        <div className="pt-2 border-t mt-2">
                          {s.instructorReport ? (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                簽退時間:
                                {s.instructorReportedAt &&
                                  format(s.instructorReportedAt, "yyyy/MM/dd HH:mm")}
                              </p>
                              <p className="text-sm bg-muted p-2 rounded">{s.instructorReport}</p>
                              <Button variant="ghost" size="sm" onClick={() => openReportDialog(s)}>
                                編輯回報
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => openReportDialog(s)}>
                              填寫簽退回報
                            </Button>
                          )}
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

      <Dialog open={!!reportingSchedule} onOpenChange={(open) => !open && setReportingSchedule(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>簽退回報</DialogTitle>
            <DialogDescription>
              {reportingSchedule?.title} —{" "}
              {reportingSchedule && format(reportingSchedule.startTime, "yyyy/MM/dd HH:mm")}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="請簡述本次上課內容、學員參與狀況,或任何需要記錄的事項"
            rows={5}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportingSchedule(null)} disabled={submittingReport}>
              取消
            </Button>
            <Button onClick={handleSubmitReport} disabled={submittingReport || !reportText.trim()}>
              {submittingReport ? "送出中..." : "送出回報"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
