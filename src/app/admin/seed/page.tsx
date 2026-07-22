"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { applications } from "@/lib/data";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";

// 這是一次性使用的工具頁,把 lib/data.ts 裡的假資料寫進 Firestore
// 用完之後建議把這個檔案刪掉,避免之後不小心又點到,把真實資料蓋回假資料
export default function SeedPage() {
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);

  async function handleSeed() {
    setRunning(true);
    setStatus("寫入中...");
    try {
      for (const app of applications) {
        const { id, ...data } = app;
        await setDoc(doc(db, "applications", id), data);
      }
      setStatus(`完成,已寫入 ${applications.length} 筆講師履歷資料到 Firestore`);
    } catch (err) {
      console.error(err);
      setStatus("寫入失敗,請打開瀏覽器 console 看詳細錯誤訊息");
    } finally {
      setRunning(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="p-8 space-y-4 max-w-lg">
        <h1 className="text-xl font-bold">一次性資料匯入工具</h1>
        <p className="text-sm text-muted-foreground">
          點擊按鈕會把 lib/data.ts 裡的 8 筆講師履歷假資料寫進 Firestore 的
          applications collection,只需要執行一次。完成後請把
          app/admin/seed 這個資料夾整個刪掉。
        </p>
        <Button onClick={handleSeed} disabled={running}>
          {running ? "寫入中..." : "匯入資料到 Firestore"}
        </Button>
        {status && <p className="text-sm">{status}</p>}
      </div>
    </ProtectedRoute>
  );
}
