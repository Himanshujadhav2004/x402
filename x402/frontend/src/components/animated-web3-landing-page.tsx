import React, { useState, useEffect } from "react";

export function Web3HeroAnimated() {
  const pillars = [92, 84, 78, 70, 62, 54, 46, 34, 18, 34, 46, 54, 62, 70, 78, 84, 92];

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes subtlePulse {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.03); }
          }

          .animate-fadeInUp {
            animation: fadeInUp 0.8s ease-out forwards;
          }
        `}
      </style>

      <section className="relative isolate h-screen overflow-hidden bg-black text-white">
        <div
          aria-hidden
          className="absolute inset-0 -z-30"
          style={{
            backgroundImage: [
              "radial-gradient(80% 55% at 50% 52%, rgba(16,228,108,0.45) 0%, rgba(34,197,94,0.46) 27%, rgba(22,101,52,0.38) 47%, rgba(20,83,45,0.45) 60%, rgba(8,8,12,0.92) 78%, rgba(0,0,0,1) 88%)",
              "radial-gradient(85% 60% at 14% 0%, rgba(74,222,128,0.65) 0%, rgba(34,197,94,0.58) 30%, rgba(20,83,45,0.0) 64%)",
              "radial-gradient(70% 50% at 86% 22%, rgba(16,228,108,0.40) 0%, rgba(16,18,28,0.0) 55%)",
              "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0) 40%)",
            ].join(","),
            backgroundColor: "#000",
          }}
        />

        <div aria-hidden className="absolute inset-0 -z-20 bg-[radial-gradient(140%_120%_at_50%_0%,transparent_60%,rgba(0,0,0,0.85))]" />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 mix-blend-screen opacity-30"
          style={{
            backgroundImage: [
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.09) 0 1px, transparent 1px 96px)",
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 24px)",
              "repeating-radial-gradient(80% 55% at 50% 52%, rgba(255,255,255,0.08) 0 1px, transparent 1px 120px)"
            ].join(","),
            backgroundBlendMode: "screen",
          }}
        />

        <div className="relative z-10 mx-auto grid w-full max-w-5xl place-items-center px-6 py-16 md:py-24 lg:py-28">
          <div className={`mx-auto text-center ${isMounted ? "animate-fadeInUp" : "opacity-0"}`}>
            <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-[11px] uppercase tracking-wider text-white/70 ring-1 ring-green-500/20 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              x402 • agentic payments
            </span>

            <h1
              style={{ animationDelay: "200ms" }}
              className={`mt-6 text-4xl font-bold tracking-tight md:text-6xl ${
                isMounted ? "animate-fadeInUp" : "opacity-0"
              }`}
            >
              Let AI agents pay for the internet
            </h1>

            <p
              style={{ animationDelay: "300ms" }}
              className={`mx-auto mt-5 max-w-2xl text-balance text-white/80 md:text-lg ${
                isMounted ? "animate-fadeInUp" : "opacity-0"
              }`}
            >
              Turn any API into a paid, on-chain service using x402 on Cronos.
              No accounts. No API keys. Agents pay per request and get instant access.
            </p>

            <div
              style={{ animationDelay: "400ms" }}
              className={`mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row ${
                isMounted ? "animate-fadeInUp" : "opacity-0"
              }`}
            >
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-full bg-green-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-green-600"
              >
                Launch Gateway
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-full border border-green-500/30 px-6 py-3 text-sm font-semibold text-white/90 backdrop-blur hover:border-green-500/60"
              >
                View Docs
              </a>
            </div>

            <p className="mt-4 text-xs text-white/60">
              Built on Cronos EVM • Powered by x402 • Designed for AI agents
            </p>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-10 w-full max-w-6xl px-6 pb-24">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-70">
            {["Cronos", "Crypto.com", "x402", "AI Agents", "EVM", "MCP"].map((brand) => (
              <div key={brand} className="text-xs uppercase tracking-wider text-white/70">
                {brand}
              </div>
            ))}
          </div>
        </div>

        <div
          className="pointer-events-none absolute bottom-[128px] left-1/2 z-0 h-36 w-28 -translate-x-1/2 rounded-md bg-gradient-to-b from-white/75 via-green-400/60 to-transparent"
          style={{ animation: "subtlePulse 6s ease-in-out infinite" }}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[54vh]">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-px px-[2px]">
            {pillars.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-black transition-height duration-1000 ease-in-out"
                style={{
                  height: isMounted ? `${h}%` : "0%",
                  transitionDelay: `${Math.abs(i - Math.floor(pillars.length / 2)) * 60}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
