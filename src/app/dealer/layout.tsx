import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dealer information pages",
  description:
    "Create a trustworthy property information page. Not a CRM, lead list, or listing tool. No account required.",
};

export default function DealerLayout({ children }: LayoutProps<"/dealer">) {
  return children;
}
