export default function Logo({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g transform="rotate(12 12 12)">
        <rect x="10" y="2" width="4" height="20" fill={color} />
        <rect x="2" y="10" width="20" height="4" fill={color} />
        <rect x="6" y="6" width="3" height="3" fill={color} opacity="0.35" />
      </g>
    </svg>
  );
}
