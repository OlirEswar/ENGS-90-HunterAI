import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50">
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-4xl text-center">
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 shadow-lg">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-gradient">HealthCare Connect</h1>
          </div>

          <p className="mb-4 text-2xl font-semibold text-slate-700">
            Find Your Perfect Healthcare Career
          </p>

          <p className="mb-12 text-lg text-slate-600 max-w-2xl mx-auto">
            Connect with top healthcare employers seeking talented professionals like you.
            Let us match your skills and aspirations with opportunities that matter.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup/resume"
              className="group relative w-full sm:w-auto overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-teal-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto rounded-xl border-2 border-sky-500 bg-white px-8 py-4 text-lg font-semibold text-sky-600 shadow-md transition-all duration-300 hover:bg-sky-50 hover:shadow-lg hover:scale-105"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="rounded-2xl bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100">
                <svg className="h-6 w-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-800">Smart Matching</h3>
              <p className="text-slate-600">Our AI matches your skills and preferences with the best healthcare opportunities.</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100">
                <svg className="h-6 w-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-800">Top Employers</h3>
              <p className="text-slate-600">Access exclusive opportunities from leading healthcare facilities nationwide.</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-800">Fast & Easy</h3>
              <p className="text-slate-600">Simple signup process gets you connected to opportunities in minutes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
