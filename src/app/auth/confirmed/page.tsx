
import Link from "next/link";

export default function EmailConfirmedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-10 w-10 text-teal-700"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m5 12 4 4L19 6"
            />
          </svg>
        </div>

        <p className="mt-6 text-sm font-bold tracking-[0.2em] text-teal-700">
          HELORAA CLINIC
        </p>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          You're all set!
        </h1>

        <p className="mt-4 leading-7 text-slate-600">
          Your email confirmation was successful. Welcome to Heloraa Clinic!
          Let's complete your patient profile so we can get you started.
        </p>

        <Link
          href="/patient/onboarding"
          className="mt-8 flex w-full items-center justify-center rounded-xl bg-teal-700 px-5 py-3.5 font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
        >
          Continue to your profile
          <span className="ml-2" aria-hidden="true">
            →
          </span>
        </Link>

        <p className="mt-5 text-sm text-slate-500">
          Your health journey starts here.
        </p>
      </div>
    </main>
  );
}
