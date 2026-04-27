"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "enrolla_user_avatar";

type UserAvatarContextValue = {
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
};

const UserAvatarContext = createContext<UserAvatarContextValue>({
  avatarUrl: null,
  setAvatarUrl: () => {},
});

export function UserAvatarProvider({ children }: { children: React.ReactNode }) {
  const [avatarUrl, setAvatarUrlState] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setAvatarUrlState(stored);
  }, []);

  function setAvatarUrl(url: string | null) {
    setAvatarUrlState(url);
    if (url) {
      localStorage.setItem(STORAGE_KEY, url);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <UserAvatarContext.Provider value={{ avatarUrl, setAvatarUrl }}>
      {children}
    </UserAvatarContext.Provider>
  );
}

export function useUserAvatar() {
  return useContext(UserAvatarContext);
}
