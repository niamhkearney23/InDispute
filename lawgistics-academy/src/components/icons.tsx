/**
 * The few icons the app uses, drawn inline so there is no icon font to load
 * and nothing to fetch from anybody else's server. Stroke only, at the
 * current text colour, so each one takes the colour of whatever it sits in.
 */
type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="2.75" />
    </Svg>
  );
}

export function ArrowIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Svg>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5z" />
    </Svg>
  );
}

export function BriefcaseIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18" />
    </Svg>
  );
}

export function LevelIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />
    </Svg>
  );
}

export function FlameIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 21c3.9 0 7-2.7 7-6.6 0-3.6-2.5-5.9-4.3-8.4-.5 2-1.6 3.1-2.9 3.6C12 6.8 10.6 4.6 9 3c0 3.3-4 5.8-4 11.4C5 18.3 8.1 21 12 21z" />
    </Svg>
  );
}

export function SparkIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
    </Svg>
  );
}

export function RepeatIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M17 2.5l3 3-3 3" />
      <path d="M4 11V9.5a4 4 0 0 1 4-4h12M7 21.5l-3-3 3-3" />
      <path d="M20 13v1.5a4 4 0 0 1-4 4H4" />
    </Svg>
  );
}
