"use client";

import * as React from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
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

type ApplicationData = {
  status: "Pending" | "Reviewed" | "Accepted" | "Rejected";
  date: string;
  instructor: {
    name: string;
    phone: string;
    email: string;
    specialties: string[];
    teachingArea: string[];
    hourlyRate: number;
    bio: string;
  };
};

function getStatusInfo(status: ApplicationData["status"]) {
  switch (status) {
    case "Pending":
      return { text: "待處理", variant: "secondary" as const, note: "您的申請已送出,請耐心等候醫院端審核。" };
    case "Reviewed":
      return { text: "審核中", variant: "outline" as const, note: "您的申請正在審核中。" };
    case "Accepted":
      return { text: "已接受", variant: "default" as const, note: "恭喜通過審核!請填寫您的空堂時間,方便行政端安排課程。" };
    case "Rejected":
      return { text: "已拒絕", variant: "destructive" as const, note: "很遺憾這次申請未通過審核。" };
  }
}

export function MyApplicationPage() {
  const { user } = useAuth();
  const [application, setApplication] = React.useState<ApplicationData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "applications", user.uid), (snap) => {
      setApplication(snap.exists() ? (snap.data() as ApplicationData) : null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <ProtectedRoute allowedRoles={["instructor"]}>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">我的申請</h1>

        <Card>
          <CardHeader>
            <CardTitle>應徵狀態</CardTitle>
            <CardDescription>您送出的講師應徵申請目前狀態。</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">載入中...</p>
            ) : !application ? (
              <p className="text-sm text-muted-foreground py-8 text-center">找不到申請資料</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">送出日期:{application.date}</span>
                  <Badge variant={getStatusInfo(application.status).variant}>
                    {getStatusInfo(application.status).text}
                  </Badge>
                </div>
                <p className="text-sm bg-muted p-3 rounded-lg">{getStatusInfo(application.status).note}</p>

                {application.status === "Accepted" && (
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link href="/my-availability">前往填寫空堂時間</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/my-schedule">查看我的課表</Link>
                    </Button>
                  </div>
                )}

                <div className="grid gap-2 text-sm border-t pt-4">
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">姓名</span>
                    <span className="col-span-2">{application.instructor.name}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">專長</span>
                    <span className="col-span-2">{application.instructor.specialties.join("、")}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">可授課地點</span>
                    <span className="col-span-2">{application.instructor.teachingArea.join("、")}</span>
                  </div>
                  {application.status === "Accepted" && (
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">時薪</span>
                      <span className="col-span-2">{application.instructor.hourlyRate.toLocaleString()} 元/小時</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
