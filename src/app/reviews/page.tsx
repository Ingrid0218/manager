"use client";

import * as React from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PublicHeader } from "@/components/public-header";

type EnrollmentReaction = { courseTitle: string; reaction?: "happy" | "neutral" | "sad" };
type FamilyShare = { id: string; courseTitle: string; comment: string; attendeeName: string };

const REACTIONS: { key: "happy" | "neutral" | "sad"; emoji: string; label: string }[] = [
  { key: "happy", emoji: "😊", label: "開心" },
  { key: "neutral", emoji: "😐", label: "普通" },
  { key: "sad", emoji: "😞", label: "不開心" },
];

export default function ReviewsPage() {
  const [reactions, setReactions] = React.useState<EnrollmentReaction[]>([]);
  const [shares, setShares] = React.useState<FamilyShare[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "enrollments"), (snapshot) => {
      const list = snapshot.docs
        .map((d) => ({ courseTitle: d.data().courseTitle, reaction: d.data().reaction }))
        .filter((e) => e.courseTitle && e.reaction);
      setReactions(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "evaluations"), (snapshot) => {
      const list = snapshot.docs
        .map((d) => ({
          id: d.id,
          courseTitle: d.data().courseTitle,
          comment: d.data().comment,
          attendeeName: d.data().attendeeName,
        }))
        .filter((e) => e.comment);
      setShares(list);
    });
    return () => unsubscribe();
  }, []);

  const courseTitles = React.useMemo(() => {
    const set = new Set<string>();
    reactions.forEach((r) => set.add(r.courseTitle));
    shares.forEach((s) => set.add(s.courseTitle));
    return Array.from(set);
  }, [reactions, shares]);

  return (
    <div className="min-h-screen bg-[#FAF7F0]">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">課程評鑑</h1>
        <p className="text-sm text-gray-500 mb-2">
          「當下反應」是據點服務人員在下課時,現場詢問長者感受後記錄的第一手反饋。
        </p>
        <p className="text-sm text-gray-500 mb-6">「家屬的分享」則是家人自己觀察到的心得,提供另一個角度參考。</p>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-12">載入中...</p>
        ) : courseTitles.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">目前尚無課程回饋資料</p>
        ) : (
          <div className="space-y-8">
            {courseTitles.map((title) => {
              const courseReactions = reactions.filter((r) => r.courseTitle === title);
              const courseShares = shares.filter((s) => s.courseTitle === title);
              return (
                <div key={title}>
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">{title}</h2>

                  {courseReactions.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
                      <p className="text-xs text-gray-400 mb-2">長者當下反應({courseReactions.length} 次記錄)</p>
                      <div className="flex gap-6">
                        {REACTIONS.map((r) => {
                          const count = courseReactions.filter((cr) => cr.reaction === r.key).length;
                          return (
                            <div key={r.key} className="flex items-center gap-2">
                              <span className="text-2xl">{r.emoji}</span>
                              <span className="text-sm text-gray-600">
                                {r.label} × {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {courseShares.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {courseShares.map((s) => (
                        <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4">
                          <p className="text-xs text-gray-400 mb-1">{s.attendeeName} 的家屬分享</p>
                          <p className="text-sm text-gray-600">{s.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
