import React from "react";

const paths = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v11H3z" />
      <path d="M14 10h4l3 3v4h-7z" />
      <circle cx="7" cy="19" r="2" />
      <circle cx="18" cy="19" r="2" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v5h5M9 13h6M9 17h6" />
    </>
  ),
  chart: <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="m14 6-6 6 6 6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  edit: (
    <>
      <path d="m4 16-.7 4.7L8 20l11.6-11.6a2 2 0 0 0-2.8-2.8L5.2 17.2" />
      <path d="m15.5 7.5 2.8 2.8" />
    </>
  ),
  logout: (
    <>
      <path d="M10 5H5v14h5" />
      <path d="M14 8l4 4-4 4M18 12H9" />
    </>
  ),
};

export default function Icon({ name }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
