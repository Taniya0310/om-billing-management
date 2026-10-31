import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import Icon from "./Icon";

const links = [
  ["Overview", "/", "grid"],
  ["Trip register", "/trips", "truck"],
  ["Bills & payments", "/bills", "file"],
  ["Reports", "/reports", "chart"],
  ["POD & client bills", "/documents", "file"],
];

export default function Layout({
  query,
  setQuery,
  tripCount,
  onNewTrip,
  onLogout,
  user,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const displayName = user?.name || "User";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside
        className={`sidebar${sidebarCollapsed ? " collapsed" : ""}${
          mobileSidebarOpen ? " mobile-open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-mark">OM</div>
          <div>
            <strong>OM Enterprises</strong>
            <span>Bill management</span>
          </div>
          <button
            className="sidebar-toggle"
            type="button"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon name="chevron" />
          </button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {links.map(([label, path, icon]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                `nav-item${isActive ? " active" : ""}`
              }
              onClick={() => setMobileSidebarOpen(false)}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {label === "Trip register" && <b>{tripCount}</b>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="logout-button" type="button" onClick={onLogout}>
            <Icon name="logout" />
            <span>Logout</span>
          </button>
          <div className="profile">
            <div>
              <strong>{displayName}</strong>
              <span>{user?.email || "Administrator"}</span>
            </div>
            <button className="dots" type="button">
              •••
            </button>
          </div>
        </div>
      </aside>
      <button
        className="sidebar-backdrop"
        type="button"
        aria-label="Close navigation"
        onClick={() => setMobileSidebarOpen(false)}
      />
      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileSidebarOpen}
            onClick={() => setMobileSidebarOpen((open) => !open)}
          >
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <Icon name="arrow" />
            <strong>OM Enterprises</strong>
          </div>
          <div className="top-actions">
            <div className="search">
              <Icon name="search" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search trips, vehicles..."
              />
            </div>
            <button className="round-button" type="button">
              <Icon name="bell" />
              <i />
            </button>
            <div className="top-avatar">{initials}</div>
          </div>
        </header>
        <Outlet context={{ onNewTrip }} />
      </main>
    </div>
  );
}
