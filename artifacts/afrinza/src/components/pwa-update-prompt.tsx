import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt || dismissed || installed) return null;

  const handleInstall = async () => {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setPrompt(null);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-[#1a1a2e] text-white rounded-2xl shadow-2xl px-5 py-4 flex items-start gap-3 border border-white/10">
        <div className="p-2 bg-amber-500/20 rounded-full shrink-0 mt-0.5">
          <Download className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Install Afrinza</p>
          <p className="text-white/60 text-xs mt-0.5 leading-relaxed">
            Add to your home screen for fast, app-like access.
          </p>
          <Button
            size="sm"
            className="mt-2.5 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-4"
            onClick={handleInstall}
          >
            <Download className="w-3 h-3 mr-1.5" /> Install App
          </Button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/40 hover:text-white transition-colors shrink-0 mt-0.5"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
