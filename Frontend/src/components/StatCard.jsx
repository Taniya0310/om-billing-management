import React from "react";
import Icon from "./Icon";

export default function StatCard({ label, value, note, tone, icon }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon name={icon} />
      </div>
      <div className="stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}
