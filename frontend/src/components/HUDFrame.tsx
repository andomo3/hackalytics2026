/**
 * HUDFrame -- fixed corner-bracket overlay that frames the command center
 * in a sci-fi tactical HUD style. All pointer-events-none so it never
 * interferes with interaction.
 */
export function HUDFrame() {

  const bracketSize = 48;
  const strokeColor = 'rgba(34, 211, 238, 0.35)';
  const strokeWidth = 2;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 30 }}
      aria-hidden="true"
    >
      {/* Top-left corner bracket */}
      <svg
        width={bracketSize}
        height={bracketSize}
        className="absolute top-2 left-2"
        viewBox={`0 0 ${bracketSize} ${bracketSize}`}
      >
        <polyline
          points={`${bracketSize},0 0,0 0,${bracketSize}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </svg>

      {/* Top-right corner bracket */}
      <svg
        width={bracketSize}
        height={bracketSize}
        className="absolute top-2 right-2"
        viewBox={`0 0 ${bracketSize} ${bracketSize}`}
      >
        <polyline
          points={`0,0 ${bracketSize},0 ${bracketSize},${bracketSize}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </svg>

      {/* Bottom-left corner bracket */}
      <svg
        width={bracketSize}
        height={bracketSize}
        className="absolute bottom-2 left-2"
        viewBox={`0 0 ${bracketSize} ${bracketSize}`}
      >
        <polyline
          points={`${bracketSize},${bracketSize} 0,${bracketSize} 0,0`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </svg>

      {/* Bottom-right corner bracket */}
      <svg
        width={bracketSize}
        height={bracketSize}
        className="absolute bottom-2 right-2"
        viewBox={`0 0 ${bracketSize} ${bracketSize}`}
      >
        <polyline
          points={`0,${bracketSize} ${bracketSize},${bracketSize} ${bracketSize},0`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </svg>

      {/* Subtle edge lines connecting corners */}
      {/* Top edge */}
      <div
        className="absolute left-14 right-14"
        style={{ top: '8px', height: '1px', background: 'rgba(34, 211, 238, 0.08)' }}
      />
      {/* Bottom edge */}
      <div
        className="absolute left-14 right-14"
        style={{ bottom: '8px', height: '1px', background: 'rgba(34, 211, 238, 0.08)' }}
      />
      {/* Left edge */}
      <div
        className="absolute top-14 bottom-14"
        style={{ left: '8px', width: '1px', background: 'rgba(34, 211, 238, 0.08)' }}
      />
      {/* Right edge */}
      <div
        className="absolute top-14 bottom-14"
        style={{ right: '8px', width: '1px', background: 'rgba(34, 211, 238, 0.08)' }}
      />

      {/* Top-right: CROWDSHIELD watermark */}
      <div
        className="absolute font-mono"
        style={{
          top: '14px',
          right: '60px',
          fontSize: '9px',
          letterSpacing: '0.15em',
          color: 'rgba(34, 211, 238, 0.2)',
        }}
      >
        CROWDSHIELD v1.0
      </div>



      {/* Top-left: Hacklytics badge */}
      <div
        className="absolute font-mono"
        style={{
          top: '14px',
          left: '60px',
          fontSize: '9px',
          letterSpacing: '0.1em',
          color: 'rgba(34, 211, 238, 0.2)',
        }}
      >
        HACKLYTICS 2026
      </div>
    </div>
  );
}


