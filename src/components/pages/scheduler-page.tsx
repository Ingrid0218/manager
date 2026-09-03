"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

type AcceptedInstructor = {
  id: string;
  name: string;
  specialties: string[];
  teachingArea: string[];
};
type LocationItem = { id: string; name: string; address: string };
type CourseCatalogItem = { id: string; title: string; category: string };
type ScheduleItem = {
  id: string;
  title: string;
  instructorId: string;
  instructorName: string;
  locationId: string;
  locationName: string;
  startTime: Date;
  endTime: Date;
  status: "scheduled" | "completed" | "cancelled";
  cancelReason?: "instructor_absent" | "other";
};

function combineDateAndTime(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(hours || 0, minutes || 0, 0, 0);
  return combined;
}

function getStatusBadge(s: ScheduleItem) {
  if (s.status === "completed") return { text: "已完成", variant: "default" as const };
  if (s.status === "cancelled") {
    return s.cancelReason === "instructor_absent"
      ? { text: "講師未到", variant: "destructive" as const }
      : { text: "已取消", variant: "destructive" as const };
  }
  return null; // "scheduled" 不特別標示,維持原本乾淨的樣子
}

export function SchedulerPage() {
  const { role, siteId } = useAuth();
  const isAdmin = role === "admin";

  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [instructorFilter, setInstructorFilter] = React.useState<string>("all");
  const [locationFilter, setLocationFilter] = React.useState<string>("all");
  const [isClient, setIsClient] = React.useState(false);

  const [acceptedInstructors, setAcceptedInstructors] = React.useState<AcceptedInstructor[]>([]);
  const [locationsData, setLocationsData] = React.useState<LocationItem[]>([]);
  const [courseCatalog, setCourseCatalog] = React.useState<CourseCatalogItem[]>([]);
  const [schedules, setSchedules] = React.useState<ScheduleItem[]>([]);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingScheduleId, setEditingScheduleId] = React.useState<string | null>(null);
  const [newCourseId, setNewCourseId] = React.useState("");
  const [newInstructorId, setNewInstructorId] = React.useState("");
  const [newLocationId, setNewLocationId] = React.useState("");
  const [newDateStr, setNewDateStr] = React.useState("");
  const [newStartTime, setNewStartTime] = React.useState("10:00");
  const [newEndTime, setNewEndTime] = React.useState("11:00");
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    setDate(new Date());
  }, []);

  React.useEffect(() => {
    if (!isAdmin) return; // applications 有敏感履歷資料,只有 admin 能讀,staff 不該送這個查詢
    const q = query(collection(db, "applications"), where("status", "==", "Accepted"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.instructorId,
          name: data.instructor.name,
          specialties: data.instructor.specialties ?? [],
          teachingArea: data.instructor.teachingArea ?? [],
        } as AcceptedInstructor;
      });
      setAcceptedInstructors(list);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "locations"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as LocationItem));
      setLocationsData(list);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CourseCatalogItem));
      setCourseCatalog(list);
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
          instructorId: data.instructorId,
          instructorName: data.instructorName,
          locationId: data.locationId,
          locationName: data.locationName,
          startTime: (data.startTime as Timestamp).toDate(),
          endTime: (data.endTime as Timestamp).toDate(),
          status: data.status,
          cancelReason: data.cancelReason,
        } as ScheduleItem;
      });
      setSchedules(list);
    });
    return () => unsubscribe();
  }, []);

  // staff 只看得到自己據點的排班,admin 看全部
  const scopedSchedules = React.useMemo(() => {
    return isAdmin ? schedules : schedules.filter((s) => s.locationId === siteId);
  }, [schedules, isAdmin, siteId]);

  const filteredSchedules = React.useMemo(() => {
    return scopedSchedules
      .filter((s) => date && isSameDay(s.startTime, date))
      .filter((s) => instructorFilter === "all" || s.instructorId === instructorFilter)
      .filter((s) => locationFilter === "all" || s.locationId === locationFilter);
  }, [scopedSchedules, date, instructorFilter, locationFilter]);

  // 講師篩選下拉選單的來源:admin 用 applications 抓到的完整名單(新增排班的連動篩選也要用);
  // staff 不能讀 applications,改成直接從自己據點目前有的排班資料裡整理出現過的講師,一樣夠用
  const instructorFilterOptions = React.useMemo(() => {
    if (isAdmin) return acceptedInstructors.map((i) => ({ id: i.id, name: i.name }));
    const seen = new Map<string, string>();
    scopedSchedules.forEach((s) => {
      if (!seen.has(s.instructorId)) seen.set(s.instructorId, s.instructorName);
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [isAdmin, acceptedInstructors, scopedSchedules]);

  const selectedCourse = courseCatalog.find((c) => c.id === newCourseId);
  const eligibleInstructors = selectedCourse
    ? acceptedInstructors.filter((i) => i.specialties.includes(selectedCourse.category))
    : [];
  const selectedInstructor = eligibleInstructors.find((i) => i.id === newInstructorId);
  const eligibleLocations = selectedInstructor
    ? selectedInstructor.teachingArea.includes("所有據點")
      ? locationsData
      : locationsData.filter((l) => selectedInstructor.teachingArea.includes(l.name))
    : [];

  React.useEffect(() => {
    setNewInstructorId("");
    setNewLocationId("");
  }, [newCourseId]);

  React.useEffect(() => {
    setNewLocationId("");
  }, [newInstructorId]);

  function openCreateDialog() {
    setEditingScheduleId(null);
    setNewCourseId("");
    setNewInstructorId("");
    setNewLocationId("");
    setNewDateStr(date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
    setNewStartTime("10:00");
    setNewEndTime("11:00");
    setCreateOpen(true);
  }

  // 編輯既有排班:因為排班本身沒有存 courseId,用課程名稱回頭比對課程目錄,
  // 藉此才能正確帶出「這門課對應的專長分類」,連動篩選講師才會準確
  function openEditDialog(s: ScheduleItem) {
    const matchingCourse = courseCatalog.find((c) => c.title === s.title);
    setEditingScheduleId(s.id);
    setNewCourseId(matchingCourse?.id ?? "");
    setNewInstructorId(s.instructorId);
    setNewLocationId(s.locationId);
    setNewDateStr(format(s.startTime, "yyyy-MM-dd"));
    setNewStartTime(format(s.startTime, "HH:mm"));
    setNewEndTime(format(s.endTime, "HH:mm"));
    setCreateOpen(true);
  }

  async function handleSaveSchedule() {
    if (!selectedCourse || !selectedInstructor || !newLocationId || !newDateStr || !newStartTime || !newEndTime) {
      alert("請完整填寫所有欄位");
      return;
    }
    const location = locationsData.find((l) => l.id === newLocationId);
    if (!location) return;

    const baseDate = new Date(newDateStr + "T00:00:00");
    const payload = {
      title: selectedCourse.title,
      instructorId: selectedInstructor.id,
      instructorName: selectedInstructor.name,
      locationId: location.id,
      locationName: location.name,
      startTime: Timestamp.fromDate(combineDateAndTime(baseDate, newStartTime)),
      endTime: Timestamp.fromDate(combineDateAndTime(baseDate, newEndTime)),
    };

    setCreating(true);
    try {
      if (editingScheduleId) {
        // 用 updateDoc 只更新這幾個欄位,不會動到已經存在的 status、出席人數等資料
        await updateDoc(doc(db, "schedules", editingScheduleId), payload);
      } else {
        await addDoc(collection(db, "schedules"), { ...payload, status: "scheduled" });
      }
      setCreateOpen(false);
    } catch (err) {
      console.error("儲存排班失敗:", err);
      alert("儲存失敗,請再試一次");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteSchedule() {
    if (!editingScheduleId) return;
    if (!confirm("確定要刪除這筆排班嗎?這個動作無法復原,如果是課程被取消,建議用「取消課程」而不是刪除,才能保留紀錄。")) {
      return;
    }
    setCreating(true);
    try {
      await deleteDoc(doc(db, "schedules", editingScheduleId));
      setCreateOpen(false);
    } catch (err) {
      console.error("刪除排班失敗:", err);
      alert("刪除失敗,請再試一次");
    } finally {
      setCreating(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            {isAdmin ? "講師排班" : "本據點課程行事曆"}
          </h1>
          {/* 只有 admin 能新增排班,staff 這個頁面是唯讀查看用 */}
          {isAdmin && <Button onClick={openCreateDialog}>新增排班</Button>}
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>課程行事曆</CardTitle>
              <CardDescription>點擊日期查看當天的課程安排。</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {isClient && (
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md"
                  locale={zhTW}
                  month={date}
                  onMonthChange={(newMonth) => {
                    const today = new Date();
                    if (
                      newMonth.getMonth() !== today.getMonth() ||
                      newMonth.getFullYear() !== today.getFullYear()
                    ) {
                      const newDate = new Date(newMonth);
                      newDate.setDate(1);
                      setDate(newDate);
                    } else {
                      setDate(today);
                    }
                  }}
                  modifiers={{
                    events: scopedSchedules.map((s) => s.startTime),
                  }}
                  modifiersStyles={{
                    events: {
                      color: "hsl(var(--primary-foreground))",
                      backgroundColor: "hsl(var(--primary))",
                    },
                  }}
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                {date ? format(date, "yyyy年MM月dd日", { locale: zhTW }) : "選擇日期"}
              </CardTitle>
              <CardDescription>當日課程列表</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select value={instructorFilter} onValueChange={setInstructorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="篩選講師" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有講師</SelectItem>
                    {instructorFilterOptions.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        {instructor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* staff 只有一個據點,篩選據點對他們沒有意義,只給 admin 看 */}
                {isAdmin && (
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="篩選據點" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有據點</SelectItem>
                      {locationsData.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Separator />
              <ScrollArea className="h-[280px]">
                <div className="space-y-4 pr-4">
                  {filteredSchedules.length > 0 ? (
                    filteredSchedules.map((s) => {
                      const statusBadge = getStatusBadge(s);
                      return (
                        <div
                          key={s.id}
                          className={`p-3 bg-card rounded-lg border ${
                            s.status === "cancelled" ? "opacity-60" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={`font-semibold ${
                                s.status === "cancelled" ? "line-through" : ""
                              }`}
                            >
                              {s.title}
                            </h4>
                            {statusBadge && (
                              <Badge variant={statusBadge.variant} className="shrink-0">
                                {statusBadge.text}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(s.startTime, "HH:mm")} - {format(s.endTime, "HH:mm")}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex gap-2">
                              <Badge variant="secondary">{s.instructorName}</Badge>
                              {isAdmin && <Badge variant="outline">{s.locationName}</Badge>}
                            </div>
                            {isAdmin && (
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(s)}>
                                編輯
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      <p>{date ? "本日無課程安排" : "請選擇日期"}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {isAdmin && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingScheduleId ? "編輯排班" : "新增排班"}</DialogTitle>
              <DialogDescription>
                選課程後,只會列出專長相符的講師;選講師後,只會列出他能授課的據點。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="text-sm font-medium mb-1 block">課程</label>
                <Select value={newCourseId} onValueChange={setNewCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇課程" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseCatalog.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">尚未建立課程目錄</div>
                    ) : (
                      courseCatalog.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}({c.category})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">講師</label>
                <Select value={newInstructorId} onValueChange={setNewInstructorId} disabled={!selectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCourse ? "選擇講師" : "請先選課程"} />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleInstructors.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        沒有專長符合「{selectedCourse?.category}」的講師
                      </div>
                    ) : (
                      eligibleInstructors.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedInstructor && (
                  <p className="text-xs text-muted-foreground mt-1">
                    專長:{selectedInstructor.specialties.join("、")} ｜ 可授課地點:
                    {selectedInstructor.teachingArea.join("、")}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">據點</label>
                <Select value={newLocationId} onValueChange={setNewLocationId} disabled={!selectedInstructor}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedInstructor ? "選擇據點" : "請先選講師"} />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleLocations.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        這位講師的教學區域裡沒有符合的據點
                      </div>
                    ) : (
                      eligibleLocations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">日期</label>
                <Input type="date" value={newDateStr} onChange={(e) => setNewDateStr(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">開始時間</label>
                  <Input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">結束時間</label>
                  <Input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter className="flex-row justify-between sm:justify-between">
              {editingScheduleId ? (
                <Button variant="destructive" onClick={handleDeleteSchedule} disabled={creating}>
                  刪除
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                  取消
                </Button>
                <Button onClick={handleSaveSchedule} disabled={creating}>
                  {creating ? "儲存中..." : editingScheduleId ? "確認修改" : "確認新增"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </ProtectedRoute>
  );
}
