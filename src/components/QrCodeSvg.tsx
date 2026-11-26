import { useMemo } from 'react';
import { generateQrMatrix } from '../lib/voyaEngine';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  compact?: boolean;
}

export function QrCodeSvg({ value, size = 184, compact = false }: QrCodeSvgProps) {
  const matrix = useMemo(() => generateQrMatrix(value, 21), [value]);
  const cells = matrix.length;
  const quietZone = 2;
  const viewBoxSize = cells + quietZone * 2;

  return (
    <div
      className={`inline-flex items-center justify-center bg-white border border-[#E2E8F0] ${
        compact ? 'p-1.5 rounded-lg' : 'p-2.5 rounded-xl shadow-xs'
      }`}
      aria-label={`Boarding QR Code for reference ${value}`}
      role="img"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        shapeRendering="crispEdges"
        className="block"
      >
        <rect width={viewBoxSize} height={viewBoxSize} fill="#FFFFFF" />
        {matrix.map((row, rIdx) =>
          row.map((filled, cIdx) =>
            filled ? (
              <rect
                key={`${rIdx}-${cIdx}`}
                x={cIdx + quietZone}
                y={rIdx + quietZone}
                width={1}
                height={1}
                fill="#0B1120"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
