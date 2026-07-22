"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// 純粹拿來排除故障用的診斷頁,跟登入、角色、安全規則完全無關
// 只測一件事:這個部署環境到底能不能連到 Firestore、讀到一份公開文件
export default function DiagnosticPage() {
  const [result, setResult] = useState("測試中...");

  useEffect(() => {
    const start = Date.now();
    getDoc(doc(db, "_diagnostic", "ping"))
      .then((snap) => {
        const ms = Date.now() - start;
        if (snap.exists()) {
          setResult(`成功!花了 ${ms}ms,讀到的資料: ${JSON.stringify(snap.data())}`);
        } else {
          setResult(`連上了伺服器(花了 ${ms}ms),但找不到 _diagnostic/ping 這份文件,請確認有沒有手動建立`);
        }
      })
      .catch((err) => {
        const ms = Date.now() - start;
        setResult(`失敗,花了 ${ms}ms 後出現錯誤: ${err.code} - ${err.message}`);
      });
  }, []);

  return (
    <div className="p-8 space-y-2">
      <h1 className="text-xl font-bold">Firestore 連線診斷</h1>
      <p className="text-sm font-mono whitespace-pre-wrap">{result}</p>
    </div>
  );
}
