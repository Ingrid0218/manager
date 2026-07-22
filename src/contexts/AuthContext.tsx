"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type Role = "admin" | "staff";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 這個監聽器會在登入、登出、重新整理頁面時自動觸發
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            // Auth 帳號存在,但 Firestore 還沒建對應的角色資料
            console.warn(
              "找不到這個使用者的角色資料,請到 Firestore 建立 users/" + firebaseUser.uid
            );
            setProfile(null);
          }
        } catch (err) {
          console.error("讀取使用者角色資料失敗:", err);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  const value: AuthContextValue = {
    user, // null 代表尚未登入
    role: profile?.role ?? null, // "admin" | "staff" | null
    siteId: profile?.site_id ?? null, // 據點承辦人所屬據點,admin 通常是 null
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
