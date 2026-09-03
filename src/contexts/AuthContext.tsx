"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type Role = "admin" | "staff" | "instructor";

interface UserProfile {
  name?: string;
  role?: Role;
  site_id?: string | null;
}

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  siteId: string | null;
  name: string | null;
  loading: boolean;
  login: (email: string, password: string) => ReturnType<typeof signInWithEmailAndPassword>;
  logout: () => ReturnType<typeof signOut>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // 判斷登入狀態,重點是:一旦發現有登入的使用者,
  // 「開始讀取角色資料」的 loading 狀態要在同一個回呼裡一起設成 true,
  // 不能拆到另一個 effect 裡分開處理,不然中間會有一個瞬間的空隙,
  // 讓 ProtectedRoute 誤判成「已經讀完,而且沒有角色」
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setProfileLoading(!!firebaseUser); // 有使用者 → 接下來要去抓角色,先標記成讀取中
      if (!firebaseUser) {
        setProfile(null);
      }
      setAuthResolved(true);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribeProfile = onSnapshot(
      doc(db, "users", user.uid),
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.metadata.fromCache && !snap.exists()) {
          return;
        }
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          console.warn("找不到這個使用者的角色資料,請到 Firestore 建立 users/" + user.uid);
          setProfile(null);
        }
        setProfileLoading(false);
      },
      (err) => {
        console.error("讀取使用者角色資料失敗:", err);
        setProfile(null);
        setProfileLoading(false);
      }
    );

    return () => unsubscribeProfile();
  }, [user]);

  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  const loading = !authResolved || profileLoading;

  const value: AuthContextValue = {
    user,
    role: profile?.role ?? null,
    siteId: profile?.site_id ?? null,
    name: profile?.name ?? null,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() 必須在 <AuthProvider> 底下使用");
  return ctx;
}
