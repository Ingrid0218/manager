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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

type InstructorOption = { id: string; name: string; status: string };
type Message = {
  id: string;
  instructorId: string;
  senderRole: "admin" | "instructor";
  senderName: string;
  content: string;
  sentAt: Date;
};

export function MessagesPage() {
  const { name } = useAuth();
  const [instructors, setInstructors] = React.useState<InstructorOption[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = React.useState<string>("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "applications"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.data().instructorId,
        name: d.data().instructor.name,
        status: d.data().status,
      }));
      setInstructors(list);
      if (!selectedInstructorId && list.length > 0) {
        setSelectedInstructorId(list[0].id);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!selectedInstructorId) return;
    const q = query(
      collection(db, "messages"),
      where("instructorId", "==", selectedInstructorId),
      orderBy("sentAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            instructorId: data.instructorId,
            senderRole: data.senderRole,
            senderName: data.senderName,
            content: data.content,
            sentAt: (data.sentAt as Timestamp).toDate(),
          };
        })
      );
    });
    return () => unsubscribe();
  }, [selectedInstructorId]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!newMessage.trim() || !selectedInstructorId) return;
    setSending(true);
    try {
      await addDoc(collection(db, "messages"), {
        instructorId: selectedInstructorId,
        senderRole: "admin",
        senderName: name ?? "行政端",
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
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">講師對話</h1>

        <Card>
          <CardHeader>
            <CardTitle>選擇講師</CardTitle>
            <CardDescription>與應徵中或已聘用的講師直接溝通。</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="選擇講師" />
              </SelectTrigger>
              <SelectContent>
                {instructors.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedInstructorId && (
          <Card>
            <CardContent className="pt-6">
              <div ref={scrollRef} className="h-[400px] overflow-y-auto space-y-3 mb-4 pr-2">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">尚無對話紀錄</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                          m.senderRole === "admin"
                            ? "bg-amber-400 text-white rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        }`}
                      >
                        <p>{m.content}</p>
                        <p className={`text-xs mt-1 ${m.senderRole === "admin" ? "text-white/70" : "text-muted-foreground"}`}>
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
        )}
      </div>
    </ProtectedRoute>
  );
}
