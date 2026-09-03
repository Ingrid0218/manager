"use client";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { format } from "date-fns";

type AcceptedInstructor = { id: string; name: string; hourlyRate: number };
type ScheduleDoc = {
  id: string;
  instructorId: string;
  startTime: Date;
  endTime: Date;
};
type PayrollRecord = {
  id: string;
  confirmedByInstructor: boolean;
};
type BillingSummary = {
  instructorId: string;
  instructorName: string;
  hourlyRate: number;
  courseCount: number;
  totalHours: number;
  totalFee: number;
  payrollRecord?: PayrollRecord;
};

function getCurrentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function BillingPage() {
  const [month, setMonth] = React.useState(getCurrentMonthStr());
  const [acceptedInstructors, setAcceptedInstructors] = React.useState<AcceptedInstructor[]>([]);
  const [schedules, setSchedules] = React.useState<ScheduleDoc[]>([]);
  const [payrollRecords, setPayrollRecords] = React.useState<Record<string, PayrollRecord>>({});
  const [loading, setLoading] = React.useState(true);
  const [generatingId, setGeneratingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const q = query(collection(db, "applications"), where("status", "==", "Accepted"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.instructorId,
          name: data.instructor.name,
          hourlyRate: data.instructor.hourlyRate,
        } as AcceptedInstructor;
      });
      setAcceptedInstructors(list);
    });
    return () => unsubscribe();
  }, []);

  // 只算「已完成」的課,講師未到、已取消的課不列入計費
  React.useEffect(() => {
    const q = query(collection(db, "schedules"), where("status", "==", "completed"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          instructorId: data.instructorId,
          startTime: (data.startTime as Timestamp).toDate(),
          endTime: (data.endTime as Timestamp).toDate(),
        } as ScheduleDoc;
      });
      setSchedules(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "payroll"), (snapshot) => {
      const map: Record<string, PayrollRecord> = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        map[d.id] = { id: d.id, confirmedByInstructor: data.confirmedByInstructor ?? false };
      });
      setPayrollRecords(map);
    });
    return () => unsubscribe();
  }, []);

  const monthSchedules = React.useMemo(() => {
    return schedules.filter((s) => format(s.startTime, "yyyy-MM") === month);
  }, [schedules, month]);

  // 已經產生過月結單的講師,金額直接用當初存下的固定紀錄,不再重新即時計算,
  // 避免課表被改動後,已經結算過的金額默默跟著變動
  const billingData: BillingSummary[] = React.useMemo(() => {
    return acceptedInstructors
      .map((instructor) => {
        const instructorSchedules = monthSchedules.filter((s) => s.instructorId === instructor.id);
        const totalHours = instructorSchedules.reduce((sum, s) => {
          return sum + (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60 * 60);
        }, 0);
        const totalFee = totalHours * instructor.hourlyRate;
        const payrollId = `${instructor.id}_${month}`;
        return {
          instructorId: instructor.id,
          instructorName: instructor.name,
          hourlyRate: instructor.hourlyRate,
          courseCount: instructorSchedules.length,
          totalHours,
          totalFee,
          payrollRecord: payrollRecords[payrollId],
        };
      })
      .filter((d) => d.courseCount > 0 || d.payrollRecord); // 這個月沒課又沒結算紀錄的講師不用列出來
  }, [acceptedInstructors, monthSchedules, month, payrollRecords]);

  const totalAmount = billingData.reduce((sum, d) => sum + d.totalFee, 0);

  async function handleGenerate(data: BillingSummary) {
    const payrollId = `${data.instructorId}_${month}`;
    setGeneratingId(payrollId);
    try {
      await setDoc(doc(db, "payroll", payrollId), {
        instructorId: data.instructorId,
        instructorName: data.instructorName,
        month,
        courseCount: data.courseCount,
        totalHours: data.totalHours,
        totalFee: data.totalFee,
        generatedAt: Timestamp.now(),
        confirmedByInstructor: false,
      });
    } catch (err) {
      console.error("產生月結單失敗:", err);
      alert("產生失敗,請再試一次");
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleToggleConfirm(payrollId: string, current: boolean) {
    try {
      await updateDoc(doc(db, "payroll", payrollId), { confirmedByInstructor: !current });
    } catch (err) {
      console.error("更新確認狀態失敗:", err);
      alert("更新失敗,請再試一次");
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-3xl font-bold tracking-tight">費用結算</h1>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-40"
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>講師費用總覽</CardTitle>
            <CardDescription>
              {month} 應支付給各講師的課程費用明細,依據「已完成」的課程計算。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">載入中...</p>
            ) : billingData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {month} 目前沒有已完成的課程
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>講師姓名</TableHead>
                    <TableHead className="text-right">授課堂數</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">鐘點費</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">總時數</TableHead>
                    <TableHead className="text-right">總費用</TableHead>
                    <TableHead className="text-right">結算狀態</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingData.map((data) => (
                    <TableRow key={data.instructorId}>
                      <TableCell className="font-medium">{data.instructorName}</TableCell>
                      <TableCell className="text-right">{data.courseCount}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        {data.hourlyRate.toLocaleString()} 元/小時
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        {data.totalHours} 小時
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {data.totalFee.toLocaleString()} 元
                      </TableCell>
                      <TableCell className="text-right">
                        {data.payrollRecord ? (
                          <Badge variant={data.payrollRecord.confirmedByInstructor ? "default" : "secondary"}>
                            {data.payrollRecord.confirmedByInstructor ? "講師已確認" : "已產生,待確認"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">尚未產生</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!data.payrollRecord ? (
                          <Button
                            size="sm"
                            disabled={generatingId === `${data.instructorId}_${month}`}
                            onClick={() => handleGenerate(data)}
                          >
                            產生月結單
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleToggleConfirm(
                                data.payrollRecord!.id,
                                data.payrollRecord!.confirmedByInstructor
                              )
                            }
                          >
                            {data.payrollRecord.confirmedByInstructor ? "取消確認" : "代為標記已確認"}
                          </Button>
                        )}
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
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
