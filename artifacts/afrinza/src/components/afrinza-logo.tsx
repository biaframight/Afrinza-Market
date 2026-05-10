interface AfrinzaLogoProps {
  className?: string;
  height?: number;
  variant?: "dark" | "light";
}

export function AfrinzaLogo({ className, height = 40, variant = "dark" }: AfrinzaLogoProps) {
  const scale = height / 44;
  const width = Math.round(210 * scale);

  const wordmarkColor = variant === "light" ? "#ffffff" : "#1c1917";
  const taglineColor  = variant === "light" ? "rgba(255,255,255,0.65)" : "#9a7c5a";

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 210 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Afrinza"
    >
      {/* ── Emblem ── */}
      <circle cx="22" cy="22" r="21" fill="#C84B31" />
      <circle cx="22" cy="22" r="17.5" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />

      {/* Geometric "A" — two legs + crossbar */}
      <line x1="22" y1="7"  x2="11" y2="31" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="22" y1="7"  x2="33" y2="31" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="14.5" y1="23" x2="29.5" y2="23" stroke="white" strokeWidth="2.8" strokeLinecap="round" />

      {/* Connection dots */}
      <circle cx="22" cy="7"  r="3.6" fill="white" />
      <circle cx="11" cy="31" r="3.6" fill="#22c55e" />
      <circle cx="33" cy="31" r="3.6" fill="#f59e0b" />

      {/* ── Wordmark ── */}
      {/* "A" always in brand orange */}
      <text
        x="50"
        y="31"
        fontFamily="Georgia, 'Palatino Linotype', serif"
        fontSize="26"
        fontWeight="700"
        fill="#C84B31"
        letterSpacing="-0.4"
      >
        A
      </text>
      {/* "frinza" — dark on light bg, white on dark bg */}
      <text
        x="67"
        y="31"
        fontFamily="Georgia, 'Palatino Linotype', serif"
        fontSize="26"
        fontWeight="700"
        fill={wordmarkColor}
        letterSpacing="-0.4"
      >
        frinza
      </text>

      {/* Tagline */}
      <text
        x="50"
        y="41"
        fontFamily="system-ui, sans-serif"
        fontSize="7"
        fontWeight="500"
        fill={taglineColor}
        letterSpacing="1.6"
      >
        AFRICAN MARKETPLACE ABROAD
      </text>
    </svg>
  );
}
