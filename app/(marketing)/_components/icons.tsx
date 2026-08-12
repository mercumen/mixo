/**
 * Landing page'in ihtiyaç duyduğu ikonlar. Hepsi inline SVG —
 * ikon paketi eklemek için önce sormak gerekiyor (CLAUDE.md).
 *
 * Tasarımdaki ikonlar tam olarak bunlar değil; currentColor ile boyanan,
 * 1.5px stroke'lu yakın karşılıkları. Gerçek set gelince burayı değiştir,
 * çağıran taraf değişmez.
 */

type IconProps = {
  className?: string;
};

const base = "shrink-0";

export function ArrowRightIcon({ className = "size-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className = "size-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

/** Feature kartlarındaki ince artı işareti. */
export function PlusIcon({ className = "size-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function UserIcon({ className = "size-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <circle cx="12" cy="8" r="3.6" />
      <path d="M12 13.6c-3.5 0-6.4 2.2-6.4 4.9 0 .6.5 1 1.1 1h10.6c.6 0 1.1-.4 1.1-1 0-2.7-2.9-4.9-6.4-4.9Z" />
    </svg>
  );
}

export function ListIcon({ className = "size-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <rect x="3" y="5" width="7" height="14" rx="1.6" />
      <rect x="12" y="5" width="9" height="2.6" rx="1.3" />
      <rect x="12" y="10.7" width="9" height="2.6" rx="1.3" />
      <rect x="12" y="16.4" width="6" height="2.6" rx="1.3" />
    </svg>
  );
}

export function PhotoIcon({ className = "size-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <path d="M3.5 6.4A2.4 2.4 0 0 1 5.9 4h12.2a2.4 2.4 0 0 1 2.4 2.4v11.2a2.4 2.4 0 0 1-2.4 2.4H5.9a2.4 2.4 0 0 1-2.4-2.4V6.4Zm2.4-.4a.4.4 0 0 0-.4.4v8.3l3.2-3a1.4 1.4 0 0 1 1.9 0l3.4 3.2 2.1-2a1.4 1.4 0 0 1 1.9 0l2 1.9V6.4a.4.4 0 0 0-.4-.4H5.9Z" />
      <circle cx="9" cy="9.6" r="1.5" />
    </svg>
  );
}

/** Pricing kartlarındaki plan amblemi. Gerçek marka ikonu gelince değişecek. */
export function PlanGlyphIcon({ className = "size-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      aria-hidden="true"
      className={`${base} ${className}`}
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M4.4 9.8h15.2" />
      <path d="M12 4c2 2.4 3 5 3 8s-1 5.6-3 8c-2-2.4-3-5-3-8s1-5.6 3-8Z" />
    </svg>
  );
}

export const featureIcons = {
  user: UserIcon,
  list: ListIcon,
  photo: PhotoIcon,
} as const;

export type FeatureIconName = keyof typeof featureIcons;
