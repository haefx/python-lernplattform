"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getVisitorState } from "@/lib/visitor";

export default function VisitorLessonGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const { onboarded } = getVisitorState();
    if (!onboarded) {
      router.replace("/");
      return;
    }
    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return <>{children}</>;
}
