/* Hand-rolled icons. One wrapper, one stroke weight, no icon package:
   nothing here can 404 or get renamed out from under the build. */

const S = ({ size = 18, sw = 1.6, children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const IconArrow = (p) => (
  <S {...p}>
    <path d="M7 17 17 7" />
    <path d="M9 7h8v8" />
  </S>
);

export const IconCheck = (p) => (
  <S {...p}>
    <path d="M20 6 9 17l-5-5" />
  </S>
);

export const IconChevron = (p) => (
  <S {...p}>
    <path d="m6 9 6 6 6-6" />
  </S>
);

export const IconPin = (p) => (
  <S {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </S>
);

export const IconPhone = (p) => (
  <S {...p}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  </S>
);

export const IconMail = (p) => (
  <S {...p}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
    <path d="m3 7 9 6 9-6" />
  </S>
);

export const IconCalendar = (p) => (
  <S {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </S>
);

export const IconClock = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </S>
);

export const IconChat = (p) => (
  <S {...p}>
    <path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3.5 21l1.6-4.8A8.5 8.5 0 1 1 21 12Z" />
  </S>
);

export const IconTree = (p) => (
  <S {...p}>
    <path d="M12 21v-5" />
    <path d="M12 4 6.5 12h11L12 4Z" />
    <path d="M12 9.5 7.8 16h8.4L12 9.5Z" />
  </S>
);

export const IconRuler = (p) => (
  <S {...p}>
    <rect x="2.5" y="8" width="19" height="8" rx="2" />
    <path d="M6 8v3M10 8v3M14 8v3M18 8v3" />
  </S>
);

export const IconShield = (p) => (
  <S {...p}>
    <path d="M12 22s7-3.2 7-10V5.5l-7-3.2-7 3.2V12c0 6.8 7 10 7 10Z" />
    <path d="m9 12 2 2 4-4" />
  </S>
);

export const IconWater = (p) => (
  <S {...p}>
    <path d="M12 3c3.2 4 5.5 6.6 5.5 9.4a5.5 5.5 0 0 1-11 0C6.5 9.6 8.8 7 12 3Z" />
  </S>
);

export const IconBolt = (p) => (
  <S {...p}>
    <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" />
  </S>
);

export const IconChapel = (p) => (
  <S {...p}>
    <path d="M12 2v5" />
    <path d="M9.5 4.5h5" />
    <path d="M12 7 5 12v9h14v-9L12 7Z" />
    <path d="M10 21v-5h4v5" />
  </S>
);

export const IconHall = (p) => (
  <S {...p}>
    <path d="M3 20h18" />
    <path d="M4 20V9l8-5 8 5v11" />
    <path d="M9 20v-6h6v6" />
  </S>
);

export const IconCourt = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3v18" />
    <path d="M3.6 8.5A9 9 0 0 1 8.5 3.6M20.4 15.5a9 9 0 0 1-4.9 4.9" />
  </S>
);

export const IconPlay = (p) => (
  <S {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3 9h18" />
    <path d="M11 12v5l4-2.5L11 12Z" />
  </S>
);

export const IconPark = (p) => (
  <S {...p}>
    <path d="M4 20c4-1.5 5-4 5-7" />
    <path d="M14 20c3-1.5 4-4 4-7" />
    <path d="M4 17.5c3 .5 5 2 6 2.5" />
    <path d="M20 17.5c-3 .5-5 2-6 2.5" />
    <path d="M9 13 9 4l6 6-4 .5 3 2.5" />
  </S>
);

export const IconLock = (p) => (
  <S {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </S>
);

export const IconRoad = (p) => (
  <S {...p}>
    <path d="M8 3 5 21M16 3l3 18" />
    <path d="M12 4v3M12 10v3M12 16v3" />
  </S>
);
