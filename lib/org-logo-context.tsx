"use client";

import { createContext, useContext, useEffect, useState } from "react";

type OrgLogoContextValue = {
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
};

const OrgLogoContext = createContext<OrgLogoContextValue>({
  logoUrl: null,
  setLogoUrl: () => {},
});

export function OrgLogoProvider({ children }: { children: React.ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/org")
      .then((r) => r.json())
      .then((d) => { if (d.logo_url) setLogoUrl(d.logo_url); })
      .catch(() => {});
  }, []);

  return (
    <OrgLogoContext.Provider value={{ logoUrl, setLogoUrl }}>
      {children}
    </OrgLogoContext.Provider>
  );
}

export function useOrgLogo() {
  return useContext(OrgLogoContext);
}
