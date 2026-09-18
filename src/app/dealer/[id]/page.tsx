"use client";

import { useParams } from "next/navigation";
import { DealerWorkspace } from "@/components/dealer/DealerWorkspace";

export default function DealerPageDetail() {
  const { id } = useParams<{ id: string }>();
  return <DealerWorkspace id={id} />;
}
