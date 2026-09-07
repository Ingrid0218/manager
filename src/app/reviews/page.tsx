"use client";

import * as React from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PublicHeader } from "@/components/public-header";
import { Star } from "lucide-react";

type Evaluation = {
  id: string;
  courseTitle: string;
  instructorName: string;
  rating: number;
  comment: string;
  attendeeName: string;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [evaluations, setEvaluations] = React.useState<Evaluation[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "evaluations"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Evaluation));
      setEvaluations(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const grouped = React.useMemo(() => {
    const map = new Map<string, Evaluation[]>();
    evaluations.forEach((e) => {
      const list = map.get(e.courseTitle) ?? [];
      list.push(e);
      map.set(e.courseTitle, list);
    });
    return Array.from(map.entries());
  }, [evaluations]);

  return (
    <div className="min-h-screen bg-[#FAF7F0]">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">課程評鑑</h1>
        <p className="text-sm text-gray-500 mb-2">
          長者與家屬對各課程的真實回饋。
        </p>
        <p className="text-xs text-gray-400 mb-6 bg-white inline-block px-3 py-1.5 rounded-lg border border-gray-100">
          報名參加課程的學員與家屬,未來將可於登入報名系統後留下回饋,目前頁面內容為已收集的回饋整理。
        </p>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-12">載入中...</p>
        ) : grouped.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">目前尚無課程評鑑資料</p>
        ) : (
          <div className="space-y-8">
            {grouped.map(([courseTitle, items]) => {
              const avgRating = items.reduce((sum, e) => sum + e.rating, 0) / items.length;
              return (
                <div key={courseTitle}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-800">{courseTitle}</h2>
                    <div className="flex items-center gap-2">
                      <StarRating rating={Math.round(avgRating)} />
                      <span className="text-xs text-gray-400">
                        平均 {avgRating.toFixed(1)} 分({items.length} 則)
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((e) => (
                      <div key={e.id} className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-1">
                          <StarRating rating={e.rating} />
                          <span className="text-xs text-gray-400">{e.attendeeName}</span>
                        </div>
                        <p className="text-sm text-gray-600">{e.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
