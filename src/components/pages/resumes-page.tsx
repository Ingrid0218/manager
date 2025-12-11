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
import { applications, type Instructor, type Application } from "@/lib/data";
import { Button } from "@/components/ui/button";

type ApplicationWithInstructor = Application & { instructor: Instructor };

export function ResumesPage() {
  const [selectedApp, setSelectedApp] =
    React.useState<ApplicationWithInstructor | null>(null);

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

  return (
    <>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">講師履歷</h1>
        <Card>
          <CardHeader>
            <CardTitle>應徵者列表</CardTitle>
            <CardDescription>
              點擊列表查看應徵講師的詳細資訊。
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                       <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedApp(app); }}>查看</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedApp && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedApp.instructor.avatarUrl} />
                    <AvatarFallback>
                      {selectedApp.instructor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-2xl">
                      {selectedApp.instructor.name}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedApp.instructor.specialties.join(" / ")}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-right text-muted-foreground">信箱</span>
                  <span className="col-span-3">
                    {selectedApp.instructor.email}
                  </span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-right text-muted-foreground">電話</span>
                  <span className="col-span-3">
                    {selectedApp.instructor.phone}
                  </span>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <span className="text-right text-muted-foreground pt-1">
                    簡介
                  </span>
                  <p className="col-span-3 text-sm">
                    {selectedApp.instructor.bio}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
