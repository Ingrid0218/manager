
'use client';

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { applications, type Instructor } from "@/lib/data";

type BillingSummary = {
  instructor: Instructor;
  courseCount: number;
  totalHours: number;
  totalFee: number;
};

export function BillingPage() {
  const [selectedInstructor, setSelectedInstructor] = React.useState<Instructor | null>(null);

  const acceptedApplications = applications.filter(
    (app) => app.status === "Accepted"
  );
  const courses = acceptedApplications.flatMap(app => app.courses || []);

  const billingData: BillingSummary[] = acceptedApplications.map((app) => {
    const instructor = app.instructor;
    const instructorCourses = courses.filter(
      (c) => c.instructorId === instructor.id
    );
    const totalHours = instructorCourses.reduce((sum, course) => {
      const duration =
        (course.endTime.getTime() - course.startTime.getTime()) /
        (1000 * 60 * 60);
      return sum + duration;
    }, 0);
    const totalFee = totalHours * instructor.hourlyRate;

    return {
      instructor: instructor,
      courseCount: instructorCourses.length,
      totalHours: totalHours,
      totalFee: totalFee,
    };
  });
  
  const totalAmount = billingData.reduce((sum, data) => sum + data.totalFee, 0);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">費用結算</h1>
          </div>
        <Card>
          <CardHeader>
            <CardTitle>講師費用總覽</CardTitle>
            <CardDescription>
              本期應支付給各講師的課程費用明細。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>講師姓名</TableHead>
                  <TableHead className="text-right">授課堂數</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    鐘點費
                  </TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    總時數
                  </TableHead>
                  <TableHead className="text-right">總費用</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingData.map((data) => (
                  <TableRow key={data.instructor.id}>
                    <TableCell className="font-medium">
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => setSelectedInstructor(data.instructor)}
                      >
                        {data.instructor.name}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      {data.courseCount}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {data.instructor.hourlyRate.toLocaleString()} 元/小時
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {data.totalHours} 小時
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {data.totalFee.toLocaleString()} 元
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-bold">總計</TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {totalAmount.toLocaleString()} 元
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Dialog open={!!selectedInstructor} onOpenChange={() => setSelectedInstructor(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedInstructor && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedInstructor.name} - 詳細資料</DialogTitle>
                <DialogDescription>
                  講師的個人背景與相關資訊。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">性別</span>
                  <span className="col-span-2">{selectedInstructor.gender}</span>
                </div>
                 <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">年齡</span>
                  <span className="col-span-2">{selectedInstructor.age}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">Email</span>
                  <span className="col-span-2">{selectedInstructor.email}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="col-span-2">{selectedInstructor.phone}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">金融帳號</span>
                  <span className="col-span-2">{selectedInstructor.bankAccount}</span>
                </div>
                 <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">專長</span>
                  <span className="col-span-2">{selectedInstructor.specialties.join(', ')}</span>
                </div>
                <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">教學區域</span>
                  <span className="col-span-2">{selectedInstructor.teachingArea.join(', ')}</span>
                </div>
                <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">教學歷程</span>
                  <span className="col-span-2">{selectedInstructor.teachingHistory.join('; ')}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">講師Level</span>
                  <span className="col-span-2">{selectedInstructor.level}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

    