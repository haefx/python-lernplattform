"use client";

import Link from "next/link";
import { createContext, useContext, useEffect } from "react";
import { setAdminPreviewActive } from "@/lib/adminPreview";

const AdminPreviewContext = createContext(false);

export function useAdminPreview(): boolean {
  return useContext(AdminPreviewContext);
}

export default function AdminPreviewShell({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    setAdminPreviewActive(true);
    return () => setAdminPreviewActive(false);
  }, []);

  return (
    <AdminPreviewContext.Provider value={true}>
      <div className="bg-warning/20 border-b border-warning/40 px-4 py-2 text-center text-sm">
        <strong>Admin-Vorschau</strong> – kein Lernfortschritt nötig, Testdaten werden
        separat gespeichert.{" "}
        <Link href="/admin" className="link link-primary font-medium">
          Zurück zum Admin
        </Link>
      </div>
      {children}
    </AdminPreviewContext.Provider>
  );
}
