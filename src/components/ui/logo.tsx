export default function Logo({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width={size} height={size} className={className}>
      <defs>
        <linearGradient id="fl-bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D97706"/>
          <stop offset="50%" stopColor="#B45309"/>
          <stop offset="100%" stopColor="#92400E"/>
        </linearGradient>
        <linearGradient id="fl-crown" x1="30" y1="20" x2="90" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF3C7"/>
          <stop offset="100%" stopColor="#FDE68A"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="28" fill="url(#fl-bg)"/>
      <path d="M30 52 L42 28 L54 44 L60 22 L66 44 L78 28 L90 52 Z" fill="url(#fl-crown)" stroke="#FEF3C7" strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="28" y="50" width="64" height="8" rx="3" fill="#FDE68A"/>
      <circle cx="42" cy="32" r="3" fill="#F59E0B"/>
      <circle cx="60" y="26" r="3.5" fill="#F59E0B"/>
      <circle cx="78" cy="32" r="3" fill="#F59E0B"/>
      <text x="60" y="82" textAnchor="middle" fontFamily="Georgia, serif" fontSize="26" fontWeight="bold" fill="white" letterSpacing="1">FL</text>
      <ellipse cx="45" cy="30" rx="8" ry="4" fill="white" opacity="0.15" transform="rotate(-15 45 30)"/>
    </svg>
  );
}
