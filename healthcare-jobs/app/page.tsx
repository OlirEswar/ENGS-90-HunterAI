'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [heartbeatPath, setHeartbeatPath] = useState('M 0,300 L 800,300');

  useEffect(() => {
    // Only run animation on larger screens
    if (window.innerWidth < 1024) {
      return;
    }

    const width = 800;
    const baseline = 300;
    const step = 2;
    const speed = 140; // Slower speed for smoother animation
    const centerX = width * 0.5;
    const baseSpikeWidth = 120;
    const baseSpikeHeight = 95;
    const wobbleBase = 1.6;
    const lineLength = 400; // Fixed length of the visible line
    const trailingSpace = 150; // Extra space after spike before it disappears

    const keyframes = [
      { t: 0, y: 0 },
      { t: 0.08, y: 0 },
      { t: 0.12, y: -0.12 },
      { t: 0.2, y: 0 },
      { t: 0.3, y: 0 },
      { t: 0.38, y: -1 },
      { t: 0.45, y: 0.62 },
      { t: 0.54, y: -0.18 },
      { t: 0.72, y: 0 },
      { t: 1, y: 0 },
    ];

    const smoothStep = (t: number) => t * t * (3 - 2 * t);

    const sampleBeat = (progress: number, amplitude: number) => {
      const normalized = Math.min(Math.max(progress, 0), 1);
      for (let i = 1; i < keyframes.length; i++) {
        const prev = keyframes[i - 1];
        const next = keyframes[i];
        if (normalized <= next.t) {
          const span = next.t - prev.t || 1;
          const rawT = (normalized - prev.t) / span;
          const eased = smoothStep(Math.min(Math.max(rawT, 0), 1));
          const value = prev.y + (next.y - prev.y) * eased;
          return value * amplitude;
        }
      }
      return 0;
    };

    const baselineWobble = (x: number, seed: number, intensity: number) => (
      Math.sin((x + seed) * 0.035) * intensity + Math.sin((x + seed) * 0.008) * (intensity * 0.6)
    );

    let endX = 0;
    let lastTime = performance.now();
    let animationFrame = 0;
    let spikeWidth = baseSpikeWidth;
    let spikeHeight = baseSpikeHeight;
    let wobbleIntensity = wobbleBase;
    let noiseSeed = Math.random() * 1000;

    const resetCycle = () => {
      endX = 0;
      spikeWidth = baseSpikeWidth + (Math.random() * 26 - 13);
      spikeHeight = baseSpikeHeight * (0.85 + Math.random() * 0.3);
      wobbleIntensity = wobbleBase * (0.75 + Math.random() * 0.5);
      noiseSeed = Math.random() * 1000;
    };

    const animate = (now: number) => {
      const delta = Math.min(now - lastTime, 50);
      endX += (speed * delta) / 1000;
      lastTime = now;

      const spikeStart = centerX - spikeWidth / 2;
      const spikeEnd = centerX + spikeWidth / 2;

      // Calculate the window of the line to draw (fixed length)
      const startX = Math.max(0, endX - lineLength);
      const maxX = endX;

      let path = `M ${startX},${baseline}`;

      for (let x = startX; x <= maxX; x += step) {
        let y = baseline;

        // Check if this point is within the spike region
        if (x >= spikeStart && x <= spikeEnd + trailingSpace) {
          if (x <= spikeEnd) {
            // We're in the spike itself
            const progress = (x - spikeStart) / spikeWidth;
            y = baseline + sampleBeat(progress, spikeHeight);
          } else {
            // We're in the trailing space after the spike
            y = baseline + baselineWobble(x, noiseSeed, wobbleIntensity);
          }
        } else {
          y = baseline + baselineWobble(x, noiseSeed, wobbleIntensity);
        }

        path += ` L ${x},${y.toFixed(2)}`;
      }

      // Handle fractional end point
      if (maxX % step !== 0 && maxX > startX) {
        let y = baseline;
        if (maxX >= spikeStart && maxX <= spikeEnd + trailingSpace) {
          if (maxX <= spikeEnd) {
            const progress = (maxX - spikeStart) / spikeWidth;
            y = baseline + sampleBeat(progress, spikeHeight);
          } else {
            y = baseline + baselineWobble(maxX, noiseSeed, wobbleIntensity);
          }
        } else {
          y = baseline + baselineWobble(maxX, noiseSeed, wobbleIntensity);
        }
        path += ` L ${maxX.toFixed(2)},${y.toFixed(2)}`;
      }

      setHeartbeatPath(path);

      // Reset when the spike has completely passed through and exited the visible area
      if (endX >= width + lineLength + trailingSpace) {
        resetCycle();
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 relative flex flex-col">
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
      <div className="relative z-10 flex-1 flex items-center py-8 lg:py-12">
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-24 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8 lg:space-y-10 text-center lg:text-left">
              <div className="space-y-5 lg:space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-100 border border-sky-200 rounded-full">
                  <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                  <span className="text-sky-700 text-sm font-medium">Your Healthcare Career Starts Here</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-slate-900 leading-[1.1]">
                  Hunt Down Your{" "}
                  <span className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                    Dream Career
                  </span>
                </h1>

                <p className="text-lg sm:text-xl xl:text-2xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Connect with top healthcare employers seeking talented professionals like you.
                  Our intelligent matching system helps you discover opportunities that align perfectly with your skills and aspirations.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="group relative px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-xl font-semibold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-center"
                >
                  <span className="relative z-10">Get Started Free</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-teal-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>

                <Link
                  href="/login"
                  className="px-8 sm:px-10 py-4 sm:py-5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold text-base sm:text-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 text-center"
                >
                  Log In
                </Link>
              </div>
            </div>

            {/* Right Column - Animation (hidden on mobile/tablet) */}
            <div className="hidden lg:flex relative h-full min-h-[600px] items-center justify-center">
              {/* Healthcare Animation Container */}
              <div className="relative w-full h-full flex items-center justify-center scale-125">
                {/* Heartbeat Line Animation */}
                <svg className="absolute w-full h-full opacity-50" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="heartbeatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#2dd4bf" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                    <clipPath id="heartbeatClip">
                      <rect x="0" y="0" width="800" height="600" />
                    </clipPath>
                  </defs>

                  <g clipPath="url(#heartbeatClip)">
                    <path
                      d={heartbeatPath}
                      stroke="url(#heartbeatGradient)"
                      strokeWidth="7"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </svg>

                {/* Static Heart */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-96 h-96 opacity-40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      className="text-teal-400"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={0.3}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
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
