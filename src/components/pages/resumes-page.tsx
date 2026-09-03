"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore";
import type { Instructor, Application } from "@/lib/data";

type ApplicationWithInstructor = Application & { instructor: Instructor };

export function ResumesPage() {
  const { role } = useAuth();
  const [applications, setApplications] = React.useState<ApplicationWithInstructor[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);
  const [selectedApp, setSelectedApp] = React.useState<ApplicationWithInstructor | null>(null);
  const [rateInput, setRateInput] = React.useState<number>(0);
  const [saving, setSaving] = React.useState(false);

  // 只有 admin 能讀 applications(裡面有履歷、時薪這些敏感資料),
  // 其他角色即使一瞬間經過這個頁面,也不該送出這個查詢
  React.useEffect(() => {
    if (role !== "admin") return;
    const q = query(collection(db, "applications"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as ApplicationWithInstructor)
      );
      setApplications(data);
      setLoadingData(false);
    });
    return () => unsubscribe();
  }, [role]);

  React.useEffect(() => {
    if (selectedApp) setRateInput(selectedApp.instructor.hourlyRate);
  }, [selectedApp]);

  const getStatusVariant = (status: Application["status"]) => {
    switch (status) {
      case "Accepted":
        return "default";
      case "Pending":
        return "secondary";
      case "Reviewed":
        return "outline";
      case "Rejected":
        return "destructive";
    }
  };

  const getStatusText = (status: Application["status"]) => {
    switch (status) {
      case "Accepted":
        return "已接受";
      case "Pending":
        return "待處理";
      case "Reviewed":
        return "審核中";
      case "Rejected":
        return "已拒絕";
    }
  };

  async function handleDecision(newStatus: Application["status"]) {
    if (!selectedApp) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "applications", selectedApp.id), {
        status: newStatus,
        "instructor.hourlyRate": rateInput,
      });
      setSelectedApp(null);
    } catch (err) {
      console.error("更新審核狀態失敗:", err);
      alert("更新失敗,請再試一次");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="w-full space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">講師履歷</h1>
        <Card>
          <CardHeader>
            <CardTitle>應徵者列表</CardTitle>
            <CardDescription>
              點擊列表查看應徵講師的詳細資訊。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <p className="text-sm text-muted-foreground py-8 text-center">載入中...</p>
            ) : applications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                目前沒有應徵資料
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>應徵者</TableHead>
                    <TableHead className="hidden sm:table-cell">專長</TableHead>
                    <TableHead className="hidden md:table-cell">
                      申請日期
                    </TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow
                      key={app.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedApp(app)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={app.instructor.avatarUrl} />
                            <AvatarFallback>
                              {app.instructor.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{app.instructor.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {app.instructor.specialties.join(", ")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {app.date}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusVariant(app.status)}
                          className={
                            app.status === "Accepted" ? "badge-accepted" : ""
                          }
                        >
                          {getStatusText(app.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                        >
                          查看
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedApp.instructor.name} - 詳細資料</DialogTitle>
                <DialogDescription>
                  講師的個人背景與相關資訊。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">性別</span>
                  <span className="col-span-2">{selectedApp.instructor.gender}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">年齡</span>
                  <span className="col-span-2">{selectedApp.instructor.age}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">Email</span>
                  <span className="col-span-2">{selectedApp.instructor.email}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="col-span-2">{selectedApp.instructor.phone}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">金融帳號</span>
                  <span className="col-span-2">{selectedApp.instructor.bankAccount}</span>
                </div>
                <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">專長</span>
                  <span className="col-span-2">{selectedApp.instructor.specialties.join(', ')}</span>
                </div>
                <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">教學區域</span>
                  <span className="col-span-2">{selectedApp.instructor.teachingArea.join(', ')}</span>
                </div>
                <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">教學歷程</span>
                  <span className="col-span-2">{selectedApp.instructor.teachingHistory.join('; ')}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">講師Level</span>
                  <span className="col-span-2">{selectedApp.instructor.level}</span>
                </div>
                <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                  <span className="text-muted-foreground pt-1">
                    簡介
                  </span>
                  <p className="col-span-2">
                    {selectedApp.instructor.bio}
                  </p>
                </div>

                <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2 border-t pt-4">
                  <span className="text-muted-foreground">時薪(元/小時)</span>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={rateInput}
                      onChange={(e) => setRateInput(Number(e.target.value))}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>

              {selectedApp.status !== "Accepted" && selectedApp.status !== "Rejected" && (
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="outline" disabled={saving} onClick={() => handleDecision("Rejected")}>
                    婉拒
                  </Button>
                  <Button disabled={saving} onClick={() => handleDecision("Accepted")}>
                    確認聘用
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
