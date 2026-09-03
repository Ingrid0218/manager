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
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
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
};

function combineDateAndTime(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(hours || 0, minutes || 0, 0, 0);
  return combined;
}

export function SchedulerPage() {
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [instructorFilter, setInstructorFilter] = React.useState<string>("all");
  const [locationFilter, setLocationFilter] = React.useState<string>("all");
  const [isClient, setIsClient] = React.useState(false);

  const [acceptedInstructors, setAcceptedInstructors] = React.useState<AcceptedInstructor[]>([]);
  const [locationsData, setLocationsData] = React.useState<LocationItem[]>([]);
  const [courseCatalog, setCourseCatalog] = React.useState<CourseCatalogItem[]>([]);
  const [schedules, setSchedules] = React.useState<ScheduleItem[]>([]);

  const [createOpen, setCreateOpen] = React.useState(false);
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

  // 只抓審核通過(Accepted)的講師,同時保留專長跟教學區域,篩選要用
  React.useEffect(() => {
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
  }, []);

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
        } as ScheduleItem;
      });
      setSchedules(list);
    });
    return () => unsubscribe();
  }, []);

  const filteredSchedules = React.useMemo(() => {
    return schedules
      .filter((s) => date && isSameDay(s.startTime, date))
      .filter((s) => instructorFilter === "all" || s.instructorId === instructorFilter)
      .filter((s) => locationFilter === "all" || s.locationId === locationFilter);
  }, [schedules, date, instructorFilter, locationFilter]);

  // 連動篩選核心邏輯:選了課程 → 篩出專長對得上的講師 → 選了講師 → 篩出他教學區域內的據點
  const selectedCourse = courseCatalog.find((c) => c.id === newCourseId);
  const eligibleInstructors = selectedCourse
    ? acceptedInstructors.filter((i) => i.specialties.includes(selectedCourse.category))
    : [];
  const selectedInstructor = eligibleInstructors.find((i) => i.id === newInstructorId);
  // teachingArea 裡如果出現「所有據點」這個特殊值,代表不限據點,直接列出全部;
  // 否則才照名字一一比對
  const eligibleLocations = selectedInstructor
    ? selectedInstructor.teachingArea.includes("所有據點")
      ? locationsData
      : locationsData.filter((l) => selectedInstructor.teachingArea.includes(l.name))
    : [];

  // 上層選項改變時,清空已經選好的下層選項,避免留著不再適用的舊選擇
  React.useEffect(() => {
    setNewInstructorId("");
    setNewLocationId("");
  }, [newCourseId]);

  React.useEffect(() => {
    setNewLocationId("");
  }, [newInstructorId]);

  function openCreateDialog() {
    setNewCourseId("");
    setNewInstructorId("");
    setNewLocationId("");
    setNewDateStr(date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
    setNewStartTime("10:00");
    setNewEndTime("11:00");
    setCreateOpen(true);
  }

  async function handleCreateSchedule() {
    if (!selectedCourse || !selectedInstructor || !newLocationId || !newDateStr || !newStartTime || !newEndTime) {
      alert("請完整填寫所有欄位");
      return;
    }
    const location = locationsData.find((l) => l.id === newLocationId);
    if (!location) return;

    const baseDate = new Date(newDateStr + "T00:00:00");

    setCreating(true);
    try {
      await addDoc(collection(db, "schedules"), {
        title: selectedCourse.title,
        instructorId: selectedInstructor.id,
        instructorName: selectedInstructor.name,
        locationId: location.id,
        locationName: location.name,
        startTime: Timestamp.fromDate(combineDateAndTime(baseDate, newStartTime)),
        endTime: Timestamp.fromDate(combineDateAndTime(baseDate, newEndTime)),
        status: "scheduled",
      });
      setCreateOpen(false);
    } catch (err) {
      console.error("新增排班失敗:", err);
      alert("新增失敗,請再試一次");
    } finally {
      setCreating(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">講師排班</h1>
          <Button onClick={openCreateDialog}>新增排班</Button>
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
                    events: schedules.map((s) => s.startTime),
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
                    {acceptedInstructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        {instructor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              </div>
              <Separator />
              <ScrollArea className="h-[280px]">
                <div className="space-y-4 pr-4">
                  {filteredSchedules.length > 0 ? (
                    filteredSchedules.map((s) => (
                      <div key={s.id} className="p-3 bg-card rounded-lg border">
                        <h4 className="font-semibold">{s.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(s.startTime, "HH:mm")} - {format(s.endTime, "HH:mm")}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <Badge variant="secondary">{s.instructorName}</Badge>
                          <Badge variant="outline">{s.locationName}</Badge>
                        </div>
                      </div>
                    ))
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增排班</DialogTitle>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              取消
            </Button>
            <Button onClick={handleCreateSchedule} disabled={creating}>
              {creating ? "新增中..." : "確認新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
