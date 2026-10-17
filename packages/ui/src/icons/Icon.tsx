import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(children: React.ReactNode) {
  return function IconComponent({ size = 18, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {children}
      </svg>
    );
  };
}

export const SelectIcon = base(
  <path d="M5 3.5 15.5 11l-4.3.6 2.4 4.3-1.9 1-2.4-4.3-2.8 3.2z" strokeLinejoin="round" />,
);

export const HighlightIcon = base(
  <>
    <path d="M7 12.5 12.8 6.7a1.6 1.6 0 0 1 2.3 0l.2.2a1.6 1.6 0 0 1 0 2.3L9.5 15" />
    <path d="M7 12.5 4.5 15l-1 2.5L6 16.5z" />
    <path d="M3.5 17.5h11" strokeWidth={2.4} stroke="var(--mark-yellow, #ffcb3d)" />
  </>,
);

export const PenIcon = base(
  <>
    <path d="M4 16 15.2 4.8a1.4 1.4 0 0 1 2 0l0 0a1.4 1.4 0 0 1 0 2L6 18l-3 1z" />
    <path d="M12.5 7.5 15 10" />
  </>,
);

export const CommentIcon = base(
  <path d="M3.5 4.5h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-3.2 2.8a.4.4 0 0 1-.66-.3V14.5h-1.6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />,
);

export const SignatureIcon = base(
  <>
    <path d="M3 14.5c1.3-5 2.6-7 3.4-7 .8 0 .3 3.6 1.2 3.6S10 6.5 11 6.5s-.6 6 .6 6 2-2.3 3-2.3 1 1.3 2.4 1.3" />
    <path d="M3 17.5h14" />
  </>,
);

export const ImageIcon = base(
  <>
    <rect x="3" y="4" width="14" height="12" rx="1.3" />
    <circle cx="7.2" cy="8" r="1.1" />
    <path d="M4 15 8.2 10.4a1 1 0 0 1 1.5 0L12 13l1.4-1.6a1 1 0 0 1 1.5 0L16.5 13.5" />
  </>,
);

export const TextEditIcon = base(
  <>
    <path d="M5 5h10M8 5v10M6 15h4" />
    <path d="M12.3 16.7 13 14l4-4 1.3 1.3-4 4z" />
  </>,
);

export const FieldTextIcon = base(
  <>
    <rect x="3" y="6" width="14" height="8" rx="1.1" />
    <path d="M6 10h8" />
  </>,
);

export const FieldCheckboxIcon = base(
  <>
    <rect x="4.5" y="4.5" width="11" height="11" rx="1.4" />
    <path d="M7 10.2 9 12.2l4-4.4" />
  </>,
);

export const ZoomInIcon = base(
  <>
    <circle cx="8.7" cy="8.7" r="5.2" />
    <path d="M16.5 16.5 13 13M8.7 6.2v5M6.2 8.7h5" />
  </>,
);

export const ZoomOutIcon = base(
  <>
    <circle cx="8.7" cy="8.7" r="5.2" />
    <path d="M16.5 16.5 13 13M6.2 8.7h5" />
  </>,
);

export const FolderOpenIcon = base(
  <path d="M3 6a1 1 0 0 1 1-1h3.5l1.3 1.5H16a1 1 0 0 1 1 1V8H6.3a1 1 0 0 0-.95.68L3.5 14.5V6Z M3.5 14.5 5.3 9.2a1 1 0 0 1 .95-.68H17l-2 7a1 1 0 0 1-.95.68H4.4a1 1 0 0 1-.95-1.3Z" />,
);

export const SaveIcon = base(
  <>
    <path d="M4 3.5h9l3.5 3.5v9a1 1 0 0 1-1 1h-11.5a1 1 0 0 1-1-1v-11.5a1 1 0 0 1 1-1Z" />
    <path d="M6.5 3.5V8h6V3.5" />
    <path d="M6.5 17v-4.5h7V17" />
  </>,
);

export const PagesIcon = base(
  <>
    <rect x="6.5" y="3" width="9" height="11.5" rx="1" />
    <path d="M4 6v9.5a1 1 0 0 0 1 1h8" />
  </>,
);

export const FormIcon = base(
  <>
    <rect x="4" y="3" width="12" height="14" rx="1.1" />
    <path d="M6.8 7h6.4M6.8 10h6.4" />
    <path d="M6.5 13.3 7.6 14.4l2-2.2" />
  </>,
);

export const RotateIcon = base(
  <path d="M15.5 8.5A5.8 5.8 0 1 0 16 11M15.5 5v3.5H12" />,
);

export const TrashIcon = base(
  <>
    <path d="M4.5 6h11M8 6V4.6a.9.9 0 0 1 .9-.9h2.2a.9.9 0 0 1 .9.9V6" />
    <path d="M5.5 6 6.2 16a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9L14.5 6" />
  </>,
);

export const ScissorsIcon = base(
  <>
    <circle cx="6" cy="5.5" r="1.6" />
    <circle cx="6" cy="14.5" r="1.6" />
    <path d="M7.3 6.6 16 15.5M7.3 13.4 16 4.5" />
  </>,
);

export const MergeIcon = base(
  <>
    <rect x="3.5" y="3.5" width="7" height="9" rx="1" />
    <rect x="9.5" y="7.5" width="7" height="9" rx="1" />
  </>,
);

export const ChevronLeftIcon = base(<path d="M12 4.5 7 10l5 5.5" />);
export const ChevronRightIcon = base(<path d="M8 4.5 13 10l-5 5.5" />);

export const BrandMarkIcon = base(
  <>
    <path d="M5.5 2.5h6l3 3v12h-9z" />
    <path d="M11.5 2.5v3h3" />
    <path d="M7.3 11.5 8.7 13l3-3.4" stroke="currentColor" />
  </>,
);
