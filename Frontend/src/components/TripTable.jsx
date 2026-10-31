import React, { useState } from "react";
import { money, tripBalance } from "../data/trips";
import Icon from "./Icon";

export default function TripTable({ trips, onUpdateAdvance, onEditTrip }) {
  const [editingId, setEditingId] = useState(null);
  const [advanceValue, setAdvanceValue] = useState("");
  const [menuId, setMenuId] = useState(null);
  const startEditing = (trip) => {
    setEditingId(trip.id);
    setAdvanceValue(trip.advance);
  };
  const saveEditing = (tripId) => {
    onUpdateAdvance(tripId, advanceValue);
    setEditingId(null);
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Trip / date</th>
            <th>Branch</th>
            <th>Vehicle</th>
            <th>Route</th>
            <th>Weight</th>
            <th>Freight</th>
            <th>Challan</th>
            <th>Advance</th>
            <th>Balance</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {trips.map((trip) => (
            <tr key={trip.id}>
              <td>
                <strong>{trip.id}</strong>
                <small>{trip.date}</small>
              </td>
              <td>
                <span
                  className={`branch-badge ${trip.branch === "Maharashtra" ? "maharashtra" : "jamshedpur"}`}
                >
                  {trip.branch === "Maharashtra" ? "Maharashtra" : "Jamshedpur"}
                </span>
              </td>
              <td>
                <span className="vehicle-pill">{trip.vehicle}</span>
              </td>
              <td>
                <strong>{trip.from}</strong>
                <small className="route-to">to {trip.to}</small>
              </td>
              <td>{trip.weight}</td>
              <td>{money(trip.freight)}</td>
              <td>{money(trip.challan)}</td>
              <td className="advance-cell">
                {editingId === trip.id ? (
                  <div className="advance-editor">
                    <input
                      type="number"
                      value={advanceValue}
                      onChange={(event) => setAdvanceValue(event.target.value)}
                      autoFocus
                    />
                    <button type="button" onClick={() => saveEditing(trip.id)}>
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="advance-value">
                    {money(trip.advance)}
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => startEditing(trip)}
                      aria-label={`Edit advance for ${trip.id}`}
                    >
                      <Icon name="edit" />
                    </button>
                  </div>
                )}
              </td>
              <td className="balance-cell">{money(tripBalance(trip))}</td>
              <td>
                <span
                  className={`status ${trip.status.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {trip.status}
                </span>
              </td>
              <td>
                <div className="row-actions">
                  {onEditTrip && (
                    <button
                      className="edit-trip-button"
                      type="button"
                      onClick={() => onEditTrip(trip)}
                      aria-label={`Edit ${trip.id}`}
                    >
                      <Icon name="edit" />
                      Edit
                    </button>
                  )}
                  <button
                    className="row-menu"
                    type="button"
                    onClick={() =>
                      setMenuId(menuId === trip.id ? null : trip.id)
                    }
                    aria-label={`Open actions for ${trip.id}`}
                  >
                    •••
                  </button>
                  {menuId === trip.id && onEditTrip && (
                    <div className="row-menu-popover">
                      <button
                        type="button"
                        className="menu-item"
                        onClick={() => {
                          onEditTrip(trip);
                          setMenuId(null);
                        }}
                      >
                        <Icon name="edit" />
                        Edit trip
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {trips.length === 0 && (
        <div className="empty-state">No trips match your search.</div>
      )}
    </div>
  );
}
