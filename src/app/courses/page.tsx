"use client";

import * as React from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PublicHeader } from "@/components/public-header";
import { Badge } from "@/components/ui/badge";

type CourseCatalogItem = {
  id: string;
  title: string;
  category: string;
  description: string;
};

export default function CoursesPage() {
  const [courses, setCourses] = React.useState<CourseCatalogItem[]>([]);
  const [loading, setLoading] = React.useState(true);

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

  // 依分類分組呈現,同一種類型的課程放在一起比較好瀏覽
  const grouped = React.useMemo(() => {
    const map = new Map<string, CourseCatalogItem[]>();
    courses.forEach((c) => {
      const list = map.get(c.category) ?? [];
      list.push(c);
      map.set(c.category, list);
    });
    return Array.from(map.entries());
  }, [courses]);

  return (
    <div className="min-h-screen bg-[#FAF7F0]">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">課程簡介</h1>
        <p className="text-sm text-gray-500 mb-6">
          埔里基督教醫院樂齡據點提供以下課程,歡迎長者與家屬參考。
        </p>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-12">載入中...</p>
        ) : grouped.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">目前尚未開放課程資訊</p>
        ) : (
          <div className="space-y-8">
            {grouped.map(([category, items]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">{category}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((c) => (
                    <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{c.title}</h3>
                        <Badge variant="secondary">{c.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {c.description || "課程說明準備中"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
