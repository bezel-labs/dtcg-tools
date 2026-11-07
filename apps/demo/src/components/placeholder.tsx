import type { CSSProperties } from 'react';

interface Props {
  /** What the finished graphic will show. */
  label: string;
  /** Size to draw the graphic at, in CSS pixels, at the widest layout. */
  width: number;
  height: number;
  className?: string;
}

/** Marks where a graphic goes and the size to make it. Narrower screens scale it down. */
export function Placeholder({ label, width, height, className = '' }: Props) {
  const style: CSSProperties = { maxWidth: width, aspectRatio: `${width} / ${height}` };
  return (
    <div
      className={`placeholder ${className}`.trimEnd()}
      style={style}
      role="img"
      aria-label={`Placeholder for ${label}, ${width} by ${height} pixels`}
    >
      <span className="placeholder-label" aria-hidden="true">
        {label}
      </span>
      <span className="placeholder-size" aria-hidden="true">
        {width} × {height}
      </span>
    </div>
  );
}
