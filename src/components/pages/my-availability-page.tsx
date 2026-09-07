"use client";

import * as React from "react";
import { doc, onSnapshot, setDoc, Timestamp } from "firebase/firestore";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const DAYS = [
  { key: "mon", label: "一" },
  { key: "tue", label: "二" },
  { key: "wed", label: "三" },
  { key: "thu", label: "四" },
  { key: "fri", label: "五" },
  { key: "sat", label: "六" },
  { key: "sun", label: "日" },
];

const BLOCKS = [
  { key: "morning", label: "上午" },
  { key: "afternoon", label: "下午" },
  { key: "evening", label: "晚上" },
];

function slotKey(day: string, block: string) {
  return `${day}_${block}`;
}

type ApplicationStatus = "Pending" | "Reviewed" | "Accepted" | "Rejected";

export function MyAvailabilityPage() {
  const { user } = useAuth();
  const [appStatus, setAppStatus] = React.useState<ApplicationStatus | null>(null);
  const [selectedSlots, setSelectedSlots] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [savedMessage, setSavedMessage] = React.useState("");
  const [locked, setLocked] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "applications", user.uid), (snap) => {
      setAppStatus(snap.exists() ? (snap.data().status as ApplicationStatus) : null);
    });
    return () => unsubscribe();
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "instructor_availability", user.uid), (snap) => {
      if (snap.exists()) {
        setSelectedSlots(new Set(snap.data().availableSlots ?? []));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // 讀取 admin 是否鎖定了空堂填寫,行政端正在排課的期間會暫時鎖住
  React.useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "general"), (snap) => {
      setLocked(snap.exists() ? !!snap.data().availabilityLocked : false);
    });
    return () => unsubscribe();
  }, []);

  function toggleSlot(day: string, block: string) {
    if (locked) return;
    const key = slotKey(day, block);
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleSave() {
    if (!user || locked) return;
    setSaving(true);
    setSavedMessage("");
    try {
      await setDoc(doc(db, "instructor_availability", user.uid), {
        instructorId: user.uid,
        availableSlots: Array.from(selectedSlots),
        updatedAt: Timestamp.now(),
      });
      setSavedMessage("已儲存!");
    } catch (err) {
      console.error("儲存空堂時間失敗:", err);
      setSavedMessage("儲存失敗,請再試一次");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["instructor"]}>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">空堂時間</h1>

        <Card>
          <CardHeader>
            <CardTitle>可授課時段</CardTitle>
            <CardDescription>
              勾選您方便授課的星期與時段,行政端排課時會參考這份資料。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">載入中...</p>
            ) : appStatus !== "Accepted" ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                審核通過後才能填寫空堂時間,請先到「我的申請」查看目前審核狀態。
              </p>
            ) : (
              <div className="space-y-4">
                {locked && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3">
                    🔒 目前為排課鎖定期間,行政端正在依照大家目前填寫的空堂時間安排課表,暫時無法修改,請等鎖定解除後再調整。
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2"></th>
                        {DAYS.map((d) => (
                          <th key={d.key} className="p-2 text-center font-medium">
                            週{d.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {BLOCKS.map((b) => (
                        <tr key={b.key} className="border-t">
                          <td className="p-2 text-muted-foreground whitespace-nowrap">{b.label}</td>
                          {DAYS.map((d) => (
                            <td key={d.key} className="p-2 text-center">
                              <Checkbox
                                checked={selectedSlots.has(slotKey(d.key, b.key))}
                                onCheckedChange={() => toggleSlot(d.key, b.key)}
                                disabled={locked}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={handleSave} disabled={saving || locked}>
                    {saving ? "儲存中..." : "儲存空堂時間"}
                  </Button>
                  {savedMessage && <span className="text-sm text-muted-foreground">{savedMessage}</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
