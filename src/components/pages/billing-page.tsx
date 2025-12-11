'use client';

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
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { applications } from "@/lib/data";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { notosans } from "@/lib/fonts";

type BillingSummary = {
  instructorId: string;
  instructorName: string;
  courseCount: number;
  hourlyRate: number;
  totalHours: number;
  totalFee: number;
};

export function BillingPage() {
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
      instructorId: instructor.id,
      instructorName: instructor.name,
      courseCount: instructorCourses.length,
      hourlyRate: instructor.hourlyRate,
      totalHours: totalHours,
      totalFee: totalFee,
    };
  });
  
  const totalAmount = billingData.reduce((sum, data) => sum + data.totalFee, 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.addFileToVFS("NotoSansTC-Regular.ttf", notosans);
    doc.addFont("NotoSansTC-Regular.ttf", "NotoSansTC", "normal");
    doc.setFont("NotoSansTC");

    const tableColumn = ["講師姓名", "授課堂數", "鐘點費 (元/小時)", "總時數 (小時)", "總費用 (元)"];
    const tableRows: (string | number)[][] = [];

    billingData.forEach(data => {
      const rowData = [
        data.instructorName,
        data.courseCount,
        data.hourlyRate.toLocaleString(),
        data.totalHours,
        data.totalFee.toLocaleString(),
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      didDrawPage: function (data) {
        doc.setFontSize(18);
        doc.text("講師費用總覽", data.settings.margin.left, 15);
      },
      styles: {
        font: 'NotoSansTC',
        fontStyle: 'normal',
      },
      headStyles: {
        fontStyle: 'bold',
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.text(`總計: ${totalAmount.toLocaleString()} 元`, 14, finalY + 10);


    doc.save("billing-report.pdf");
  };

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">費用結算</h1>
          <Button onClick={exportPDF}>
            <Download className="mr-2 h-4 w-4" />
            匯出報表
          </Button>
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
                <TableRow key={data.instructorId}>
                  <TableCell className="font-medium">
                    {data.instructorName}
                  </TableCell>
                  <TableCell className="text-right">
                    {data.courseCount}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    {data.hourlyRate.toLocaleString()} 元/小時
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
  );
}
