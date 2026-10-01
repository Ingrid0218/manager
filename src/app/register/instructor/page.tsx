"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, setDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type CourseCatalogItem = { id: string; title: string; category: string };
type LocationItem = { id: string; name: string };

export default function RegisterInstructorPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [courseCatalog, setCourseCatalog] = React.useState<CourseCatalogItem[]>([]);
  const [locationsData, setLocationsData] = React.useState<LocationItem[]>([]);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [gender, setGender] = React.useState<"男性" | "女性" | "其他">("男性");
  const [age, setAge] = React.useState("");
  const [bankAccount, setBankAccount] = React.useState("");
  const [specialties, setSpecialties] = React.useState<string[]>([]);
  const [teachingArea, setTeachingArea] = React.useState<string[]>([]);
  const [teachingHistory, setTeachingHistory] = React.useState("");
  const [bio, setBio] = React.useState("");

  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
      setCourseCatalog(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CourseCatalogItem)));
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "locations"), (snapshot) => {
      setLocationsData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as LocationItem)));
    });
    return () => unsubscribe();
  }, []);

  // 專長選項從課程分類去重複取得,確保跟排班頁的比對邏輯用同一套字串
  const specialtyOptions = React.useMemo(() => {
    return Array.from(new Set(courseCatalog.map((c) => c.category)));
  }, [courseCatalog]);

  function toggleSpecialty(value: string) {
    setSpecialties((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function toggleTeachingArea(value: string) {
    setTeachingArea((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password || !name || !phone || !age || !bankAccount) {
      setError("請完整填寫所有必填欄位");
      return;
    }
    if (specialties.length === 0) {
      setError("請至少選擇一項專長");
      return;
    }
    if (teachingArea.length === 0) {
      setError("請至少選擇一個可授課地點");
      return;
    }

    setSubmitting(true);
    try {
      const cred = await register(email, password);
      const uid = cred.user.uid;

      await setDoc(doc(db, "users", uid), {
        name,
        email,
        role: "instructor",
        site_id: null,
      });

      await setDoc(doc(db, "applications", uid), {
        instructorId: uid,
        date: new Date().toISOString().slice(0, 10),
        status: "Pending",
        instructor: {
          id: uid,
          name,
          avatarUrl: `https://picsum.photos/seed/${uid}/100/100`,
          email,
          phone,
          specialties,
          bio,
          hourlyRate: 0,
          gender,
          age: Number(age),
          bankAccount,
          teachingArea,
          teachingHistory: teachingHistory.split("\n").map((s) => s.trim()).filter(Boolean),
          level: "",
        },
      });

      router.push("/my-application");
    } catch (err: any) {
      console.error("註冊失敗:", err);
      if (err?.code === "auth/email-already-in-use") {
        setError("這個信箱已經註冊過了,請直接登入");
      } else if (err?.code === "auth/weak-password") {
        setError("密碼強度不夠,請至少輸入 6 個字元");
      } else {
        setError("送出失敗,請再試一次");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F0] px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6">
          <p className="text-sm font-bold text-gray-900">Puli Christian Hospital</p>
          <h1 className="text-xl font-bold text-gray-900 mt-1">應徵講師</h1>
          <p className="text-sm text-gray-500 mt-2">
            填寫以下資料建立帳號並送出履歷,審核結果會顯示在登入後的「我的申請」頁面。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">電子郵件 *</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">密碼 *</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 個字元"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">姓名 *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">電話 *</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">性別</label>
              <Select value={gender} onValueChange={(v) => setGender(v as typeof gender)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="男性">男性</SelectItem>
                  <SelectItem value="女性">女性</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">年齡 *</label>
              <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">金融帳號 *</label>
              <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="供之後撥款用" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">專長 *(可複選)</label>
            <div className="grid grid-cols-2 gap-2 border rounded-lg p-3">
              {specialtyOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-2">課程分類載入中...</p>
              ) : (
                specialtyOptions.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={specialties.includes(s)} onCheckedChange={() => toggleSpecialty(s)} />
                    {s}
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">可授課地點 *(可複選)</label>
            <div className="grid grid-cols-2 gap-2 border rounded-lg p-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={teachingArea.includes("所有據點")}
                  onCheckedChange={() => toggleTeachingArea("所有據點")}
                />
                所有據點
              </label>
              {locationsData.map((l) => (
                <label key={l.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={teachingArea.includes(l.name)}
                    onCheckedChange={() => toggleTeachingArea(l.name)}
                    disabled={teachingArea.includes("所有據點")}
                  />
                  {l.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">教學歷程</label>
            <Textarea
              value={teachingHistory}
              onChange={(e) => setTeachingHistory(e.target.value)}
              placeholder="每行填寫一項經歷,例如:2020-現在: 埔里基督教醫院"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">自我介紹</label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "送出中..." : "送出應徵申請"}
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
