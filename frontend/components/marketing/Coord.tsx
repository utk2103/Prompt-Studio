export default function Coord({ x, y, prefix }: { x: number | string; y: number | string; prefix?: string }) {
  return (
    <span className="d-coord">
      {prefix ? `${prefix} ` : ''}[X {x}, Y {y}]
    </span>
  );
}
