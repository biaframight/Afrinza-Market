import { Globe, ArrowRight, X } from "lucide-react";
import { useState } from "react";

const FUTURE_MARKETS = [
  { flag: "🇬🇧", name: "United Kingdom" },
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇦🇪", name: "UAE" },
  { flag: "🇩🇪", name: "Germany" },
  { flag: "🇺🇸", name: "United States" },
];

export function MarketBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-[#0f3460] via-[#1a1a2e] to-[#0f3460] text-white text-xs py-2 px-4 relative">
      <div className="container mx-auto flex items-center justify-center gap-3 flex-wrap">
        <Globe className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span className="text-white/80 font-medium">
          <span className="text-amber-400 font-bold">🇲🇾 Now live in Malaysia</span>
          <span className="mx-2 text-white/40">·</span>
          Expanding soon:
        </span>
        <div className="flex items-center gap-2">
          {FUTURE_MARKETS.map((m) => (
            <span key={m.name} title={m.name} className="text-sm leading-none opacity-80 hover:opacity-100 transition-opacity cursor-default" aria-label={m.name}>
              {m.flag}
            </span>
          ))}
        </div>
        <span className="hidden sm:flex items-center gap-1 text-white/60">
          <ArrowRight className="w-3 h-3" /> Global launch 2025
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
