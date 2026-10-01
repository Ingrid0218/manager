"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterFamilyPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password || !name || !phone) {
      setError("請完整填寫所有必填欄位");
      return;
    }

    setSubmitting(true);
    try {
      const cred = await register(email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        email,
        role: "family",
        site_id: null,
      });
      router.push("/my-elders");
    } catch (err: any) {
      console.error("註冊失敗:", err);
      if (err?.code === "auth/email-already-in-use") {
        setError("這個信箱已經註冊過了,請直接登入");
      } else if (err?.code === "auth/weak-password") {
        setError("密碼強度不夠,請至少輸入 6 個字元");
      } else {
        setError("註冊失敗,請再試一次");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6">
          <p className="text-sm font-bold text-gray-900">Puli Christian Hospital</p>
          <h1 className="text-xl font-bold text-gray-900 mt-1">註冊家屬帳號</h1>
          <p className="text-sm text-gray-500 mt-2">
            註冊後可以新增家中長輩的資料,幫他們報名課程、查看上課紀錄。一個帳號可以管理多位長輩。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">電子郵件 *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">密碼 *</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 個字元"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">您的姓名 *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">聯絡電話 *</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "註冊中..." : "完成註冊"}
          </Button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-5">
          已經有帳號了?{" "}
          <Link href="/login" className="text-amber-600 hover:underline">
            登入
          </Link>
          {" ｜ "}
          <Link href="/" className="hover:underline">
            回首頁
          </Link>
        </p>
      </div>
    </div>
  );
}
