"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

type CourseCatalogItem = {
  id: string;
  title: string;
  category: string;
  description: string;
};

export function CourseCatalogPage() {
  const [courses, setCourses] = React.useState<CourseCatalogItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        title: d.data().title,
        category: d.data().category,
        description: d.data().description ?? "",
      }));
      setCourses(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  function openCreateDialog() {
    setEditingId(null);
    setTitle("");
    setCategory("");
    setDescription("");
    setDialogOpen(true);
  }

  function openEditDialog(c: CourseCatalogItem) {
    setEditingId(c.id);
    setTitle(c.title);
    setCategory(c.category);
    setDescription(c.description);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!title || !category) {
      alert("請填寫課程名稱與分類");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "courses", editingId), { title, category, description });
      } else {
        await addDoc(collection(db, "courses"), { title, category, description });
      }
      setDialogOpen(false);
    } catch (err) {
      console.error("儲存課程失敗:", err);
      alert("儲存失敗,請再試一次");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingId) return;
    if (!confirm("確定要刪除這門課程嗎?如果已經有排班使用這個課程名稱,建議先確認過再刪除。")) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, "courses", editingId));
      setDialogOpen(false);
    } catch (err) {
      console.error("刪除課程失敗:", err);
      alert("刪除失敗,請再試一次");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">課程管理</h1>
          <Button onClick={openCreateDialog}>新增課程</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>課程目錄</CardTitle>
            <CardDescription>
              這裡維護的課程名稱、分類與說明,會顯示在對外公開的課程簡介頁面,分類也會用來篩選講師的授課專長。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">載入中...</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">尚未建立任何課程</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {courses.map((c) => (
                  <div key={c.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold">{c.title}</h4>
                      <Badge variant="secondary">{c.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {c.description || "尚未填寫課程說明"}
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(c)}>
                      編輯
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "編輯課程" : "新增課程"}</DialogTitle>
            <DialogDescription>
              分類會作為講師登記專長時的選項,請盡量沿用現有分類,不要每次都取新名字。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">課程名稱</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如:懷舊金曲歡唱" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">分類</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="例如:音樂療法" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">課程說明(會顯示在公開頁面)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="簡述這門課的內容、適合對象、能帶來什麼幫助"
              />
            </div>
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between">
            {editingId ? (
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                刪除
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "儲存中..." : editingId ? "確認修改" : "確認新增"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
