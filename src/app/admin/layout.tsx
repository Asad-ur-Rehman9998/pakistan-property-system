import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff desk",
  description: "Permissioned staff desk. Not every admin has unlimited access. Not a listing board.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
