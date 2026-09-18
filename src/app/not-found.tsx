import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Page not found / صفحہ نہیں ملا</h1>
      <p className="mt-2 text-[var(--muted)]">Yeh link kaam nahi kar raha.</p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        Home
      </Link>
    </div>
  );
}
