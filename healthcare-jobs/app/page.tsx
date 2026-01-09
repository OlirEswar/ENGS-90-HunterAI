'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 3);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 overflow-hidden relative flex flex-col">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/3 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-8 lg:px-20 py-8">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 shadow-xl">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-teal-600 bg-clip-text text-transparent">Health Care Hunter</span>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="px-6 py-2.5 text-slate-700 hover:text-slate-900 font-medium transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-8 py-3 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="w-full max-w-[1600px] mx-auto px-8 lg:px-20">
          <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">
            {/* Left Column - Content */}
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-100 border border-sky-200 rounded-full">
                  <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                  <span className="text-sky-700 text-sm font-medium">Your Healthcare Career Starts Here</span>
                </div>

                <h1 className="text-6xl xl:text-7xl 2xl:text-8xl font-bold text-slate-900 leading-[1.1]">
                  Hunt Down Your{" "}
                  <span className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                    Dream Career
                  </span>
                </h1>

                <p className="text-xl xl:text-2xl text-slate-600 leading-relaxed max-w-2xl">
                  Connect with top healthcare employers seeking talented professionals like you.
                  Our intelligent matching system helps you discover opportunities that align perfectly with your skills and aspirations.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="group relative px-10 py-5 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-center"
                >
                  <span className="relative z-10">Get Started Free</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-teal-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>

                <Link
                  href="/login"
                  className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 text-center"
                >
                  Log In
                </Link>
              </div>
            </div>

            {/* Right Column - Animation */}
            <div className="relative h-full min-h-[500px] flex items-center justify-center">
              {/* Healthcare Animation Container */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Heartbeat Line Animation */}
                <svg className="absolute w-full h-full opacity-30" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="heartbeatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#2dd4bf" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M 0,300 L 150,300 L 180,250 L 210,350 L 240,270 L 270,300 L 800,300"
                    stroke="url(#heartbeatGradient)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <animate
                      attributeName="stroke-dasharray"
                      values="0,1000;1000,0;0,1000"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </path>
                </svg>

                {/* Floating Medical Icons */}
                <div className="absolute top-1/4 left-1/4 animate-float">
                  <div className="p-5 bg-sky-500/20 backdrop-blur-sm rounded-2xl border border-sky-400/30 shadow-2xl">
                    <svg className="w-12 h-12 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
                    </svg>
                  </div>
                </div>

                <div className="absolute top-1/3 right-1/4 animate-float-delayed">
                  <div className="p-5 bg-teal-500/20 backdrop-blur-sm rounded-2xl border border-teal-400/30 shadow-2xl">
                    <svg className="w-14 h-14 text-teal-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
                    </svg>
                  </div>
                </div>

                <div className="absolute bottom-1/4 left-1/3 animate-float-slow">
                  <div className="p-5 bg-emerald-500/20 backdrop-blur-sm rounded-2xl border border-emerald-400/30 shadow-2xl">
                    <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                </div>

                {/* Pulsing Heartbeat Circles */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div
                    className={`w-40 h-40 rounded-full border-4 border-sky-400/50 transition-all duration-1000 ${
                      pulsePhase === 0 ? 'scale-100 opacity-50' : 'scale-150 opacity-0'
                    }`}
                  />
                  <div
                    className={`absolute top-0 left-0 w-40 h-40 rounded-full border-4 border-teal-400/50 transition-all duration-1000 ${
                      pulsePhase === 1 ? 'scale-100 opacity-50' : 'scale-150 opacity-0'
                    }`}
                  />
                  <div
                    className={`absolute top-0 left-0 w-40 h-40 rounded-full border-4 border-emerald-400/50 transition-all duration-1000 ${
                      pulsePhase === 2 ? 'scale-100 opacity-50' : 'scale-150 opacity-0'
                    }`}
                  />
                </div>

                {/* Stethoscope Icon */}
                <div className="absolute bottom-1/3 right-1/3 animate-float">
                  <div className="p-5 bg-sky-500/20 backdrop-blur-sm rounded-2xl border border-sky-400/30 shadow-2xl">
                    <svg className="w-12 h-12 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="md:hidden relative z-10 p-6 bg-white/95 backdrop-blur-lg border-t border-slate-200">
        <div className="flex gap-3">
          <Link
            href="/login"
            className="flex-1 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold text-center hover:bg-slate-50"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-xl font-semibold text-center shadow-lg"
          >
            Sign Up
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-25px); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 5s ease-in-out infinite;
          animation-delay: 1s;
        }

        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
          animation-delay: 2s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
