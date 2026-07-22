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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
      }
      setAuthResolved(true);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    setProfileLoading(true);
    const unsubscribeProfile = onSnapshot(
      doc(db, "users", user.uid),
      { includeMetadataChanges: true },
      (snap) => {
        // 除錯用,穩定後可以刪掉這行
        console.log("[AuthContext] 收到快照,fromCache =", snap.metadata.fromCache, "exists =", snap.exists());

        // 如果這筆快照是「純本機快取、還沒真正問過伺服器」而且顯示不存在,
        // 先不要下定論,等真正跟伺服器確認過的下一筆快照進來再判斷,
        // 避免把暫時性的空快取誤判成「這個使用者沒有角色資料」
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

  const loading = !authResolved || (!!user && profileLoading);

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
