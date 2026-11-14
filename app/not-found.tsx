import Link from "next/link";
import { buttonClass } from "@/lib/button-class";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="display mt-4 text-6xl">Nothing here.</h1>
        <p className="mt-3 text-sm text-muted">The page you're looking for has moved or no longer exists.</p>
        <Link href="/" className={buttonClass("primary", "lg", "mt-8")}>
          Return home
        </Link>
      </div>
    </div>
  );
}
