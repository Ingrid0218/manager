"use client";

import * as React from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
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
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

type Message = {
  id: string;
  senderRole: "admin" | "instructor";
  senderName: string;
  content: string;
  sentAt: Date;
};

export function MyMessagesPage() {
  const { user, name } = useAuth();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "messages"), where("instructorId", "==", user.uid), orderBy("sentAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            senderRole: data.senderRole,
            senderName: data.senderName,
            content: data.content,
            sentAt: (data.sentAt as Timestamp).toDate(),
          };
        })
      );
    });
    return () => unsubscribe();
  }, [user]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    try {
      await addDoc(collection(db, "messages"), {
        instructorId: user.uid,
        senderRole: "instructor",
        senderName: name ?? "講師",
        content: newMessage.trim(),
        sentAt: Timestamp.now(),
      });
      setNewMessage("");
    } catch (err) {
      console.error("送出訊息失敗:", err);
      alert("送出失敗,請再試一次");
    } finally {
      setSending(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["instructor"]}>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">與行政端對話</h1>

        <Card>
          <CardHeader>
            <CardTitle>訊息</CardTitle>
            <CardDescription>有任何問題可以直接在這裡跟行政端聯繫。</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={scrollRef} className="h-[400px] overflow-y-auto space-y-3 mb-4 pr-2">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">尚無對話紀錄</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderRole === "instructor" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                        m.senderRole === "instructor"
                          ? "bg-amber-400 text-white rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}
                    >
                      <p>{m.content}</p>
                      <p className={`text-xs mt-1 ${m.senderRole === "instructor" ? "text-white/70" : "text-muted-foreground"}`}>
                        {m.senderName} · {format(m.sentAt, "MM/dd HH:mm")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="輸入訊息..."
              />
              <Button onClick={handleSend} disabled={sending || !newMessage.trim()}>
                送出
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
