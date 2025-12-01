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
import { courses, instructors, locations } from "@/lib/data";
import { format, isSameDay } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function SchedulerPage() {
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [instructorFilter, setInstructorFilter] = React.useState<string>("all");
  const [locationFilter, setLocationFilter] = React.useState<string>("all");

  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredCourses = React.useMemo(() => {
    return courses
      .filter((course) => date && isSameDay(course.startTime, date))
      .filter(
        (course) =>
          instructorFilter === "all" || course.instructorId === instructorFilter
      )
      .filter(
        (course) =>
          locationFilter === "all" || course.locationId === locationFilter
      );
  }, [date, instructorFilter, locationFilter]);
  
  const eventsOnSelectedDate =
    date && courses.filter((course) => isSameDay(course.startTime, date)).length > 0;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">講師排班</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>課程行事曆</CardTitle>
            <CardDescription>
              點擊日期查看當天的課程安排。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {isClient && (
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
                locale={zhTW}
                modifiers={{
                  events: courses.map((course) => course.startTime),
                }}
                modifiersStyles={{
                  events: {
                    color: "hsl(var(--primary-foreground))",
                    backgroundColor: "hsl(var(--primary))",
                  },
                }}
                defaultMonth={new Date(2024, 6, 1)}
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
              <Select
                value={instructorFilter}
                onValueChange={setInstructorFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="篩選講師" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有講師</SelectItem>
                  {instructors.map((instructor) => (
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
                  {locations.map((location) => (
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
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => {
                    const instructor = instructors.find(
                      (i) => i.id === course.instructorId
                    );
                    const location = locations.find(
                      (l) => l.id === course.locationId
                    );
                    return (
                      <div
                        key={course.id}
                        className="p-3 bg-card rounded-lg border"
                      >
                        <h4 className="font-semibold">{course.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(course.startTime, "HH:mm")} -{" "}
                          {format(course.endTime, "HH:mm")}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                           <Badge variant="secondary">{instructor?.name}</Badge>
                           <Badge variant="outline">{location?.name}</Badge>
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
  );
}
