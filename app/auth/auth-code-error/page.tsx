// app/auth/auth-code-error/page.tsx
import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
      <p className="mt-2 text-slate-600">
        There was a problem signing you in. This often happens if you refresh the page during login.
      </p>
      <Link 
        href="/login" 
        className="mt-6 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
      >
        Try Again
      </Link>
    </div>
  );
}