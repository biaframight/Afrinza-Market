import { Globe, X } from "lucide-react";
import { useState } from "react";

export function MarketBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-[#0f3460] via-[#1a1a2e] to-[#0f3460] text-white text-xs py-2 px-4 relative">
      <div className="container mx-auto flex items-center justify-center gap-3 flex-wrap">
        <Globe className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span className="text-white/80 font-medium">
          <span className="text-amber-400 font-bold">🌍 Now live for Africans in the diaspora, everywhere</span>
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
