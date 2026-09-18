"use client";

import * as React from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";

type ElderProfile = { id: string; name: string };
type EnrollmentItem = { scheduleId: string; elderId: string; status: string; reaction?: "happy" | "neutral" | "sad" };
type ScheduleInfo = {
  id: string;
  title: string;
  instructorName: string;
  startTime: Date;
  status: string;
};
type EvaluationDoc = { id: string; comment: string };

const REACTION_LABEL: Record<string, string> = { happy: "😊 開心", neutral: "😐 普通", sad: "😞 不開心" };

function MyReviewsContent() {
  const { user } = useAuth();
  const [elders, setElders] = React.useState<ElderProfile[]>([]);
  const [enrollments, setEnrollments] = React.useState<EnrollmentItem[]>([]);
  const [schedules, setSchedules] = React.useState<ScheduleInfo[]>([]);
  const [myEvaluations, setMyEvaluations] = React.useState<Record<string, EvaluationDoc>>({});
  const [loading, setLoading] = React.useState(true);

  const [reviewing, setReviewing] = React.useState<{ scheduleId: string; elderId: string; title: string; elderName: string } | null>(null);
  const [comment, setComment] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "elders"), where("familyUid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setElders(snapshot.docs.map((d) => ({ id: d.id, name: d.data().name })));
    });
    return () => unsubscribe();
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "enrollments"), where("familyUid", "==", user.uid), where("status", "==", "enrolled"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEnrollments(
        snapshot.docs.map((d) => ({
          scheduleId: d.data().scheduleId,
          elderId: d.data().elderId,
          status: d.data().status,
          reaction: d.data().reaction,
        }))
      );
    });
    return () => unsubscribe();
  }, [user]);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "schedules"), (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          instructorName: data.instructorName,
          startTime: (data.startTime as Timestamp).toDate(),
          status: data.status,
        } as ScheduleInfo;
      });
      setSchedules(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "evaluations"), where("familyUid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, EvaluationDoc> = {};
      snapshot.docs.forEach((d) => {
        map[d.id] = { id: d.id, comment: d.data().comment };
      });
      setMyEvaluations(map);
    });
    return () => unsubscribe();
  }, [user]);

  const completedAttendances = React.useMemo(() => {
    const scheduleMap = new Map(schedules.map((s) => [s.id, s]));
    const elderMap = new Map(elders.map((e) => [e.id, e]));
    return enrollments
      .map((en) => {
        const schedule = scheduleMap.get(en.scheduleId);
        const elder = elderMap.get(en.elderId);
        if (!schedule || !elder || schedule.status !== "completed") return null;
        const evalId = `${en.scheduleId}_${en.elderId}`;
        return {
          scheduleId: en.scheduleId,
          elderId: en.elderId,
          elderName: elder.name,
          title: schedule.title,
          instructorName: schedule.instructorName,
          startTime: schedule.startTime,
          reaction: en.reaction,
          existingEval: myEvaluations[evalId],
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [enrollments, schedules, elders, myEvaluations]);

  function openReviewDialog(item: { scheduleId: string; elderId: string; title: string; elderName: string; existingEval?: EvaluationDoc }) {
    setReviewing(item);
    setComment(item.existingEval?.comment ?? "");
  }

  async function handleSubmitReview() {
    if (!reviewing || !user) return;
    setSaving(true);
    try {
      const evalId = `${reviewing.scheduleId}_${reviewing.elderId}`;
      const schedule = schedules.find((s) => s.id === reviewing.scheduleId);
      await setDoc(doc(db, "evaluations", evalId), {
        scheduleId: reviewing.scheduleId,
        elderId: reviewing.elderId,
        elderName: reviewing.elderName,
        familyUid: user.uid,
        courseTitle: reviewing.title,
        instructorName: schedule?.instructorName ?? "",
        comment,
        attendeeName: reviewing.elderName,
        createdAt: Timestamp.now(),
      });
      setReviewing(null);
    } catch (err) {
      console.error("送出分享失敗:", err);
      alert("送出失敗,請再試一次");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0]">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">課程紀錄與分享</h1>
        <p className="text-sm text-gray-500 mb-6">
          長者上課當下的反應,是據點服務人員現場記錄的;這裡讓您可以額外分享自己的觀察與心得。
        </p>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-12">載入中...</p>
        ) : completedAttendances.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-400">目前還沒有已完成的課程紀錄。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedAttendances.map((item) => (
              <div key={`${item.scheduleId}_${item.elderId}`} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div>
                    <p className="text-xs text-gray-400">{format(item.startTime, "yyyy/MM/dd")} · {item.elderName}</p>
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.instructorName} 老師</p>
                    {item.reaction && (
                      <p className="text-sm text-gray-500 mt-1">現場反應:{REACTION_LABEL[item.reaction]}</p>
                    )}
                  </div>
                  <Button size="sm" variant={item.existingEval ? "outline" : "default"} onClick={() => openReviewDialog(item)}>
                    {item.existingEval ? "編輯分享" : "留下分享"}
                  </Button>
                </div>
                {item.existingEval && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-400 mb-1">您的分享</p>
                    <p className="text-sm text-gray-600">{item.existingEval.comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!reviewing} onOpenChange={(open) => !open && setReviewing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{reviewing?.title}</DialogTitle>
            <DialogDescription>分享您對 {reviewing?.elderName} 這次上課的觀察或心得</DialogDescription>
          </DialogHeader>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="例如:回家後還一直哼著今天學的歌,看起來很開心"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleSubmitReview} disabled={saving || !comment.trim()}>
              {saving ? "送出中..." : "送出分享"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MyReviewsPage() {
  return (
    <ProtectedRoute allowedRoles={["family"]}>
      <MyReviewsContent />
    </ProtectedRoute>
  );
}
