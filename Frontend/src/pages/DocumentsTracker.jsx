import React, { useEffect, useMemo, useState } from "react";
import { money } from "../data/trips";
import { apiRequest } from "../api";
import "../styles/documents-tracker.css";

const branchName = (trip) =>
  trip.branch === "Maharashtra" ? "Maharashtra" : "Jamshedpur";

function BiltyCell({ trip, bilties, onReload }) {
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");
  const addBilty = async (event) => {
    event.preventDefault();
    const value = number.trim();
    if (!value) return;
    try {
      setError("");
      await apiRequest(`/trips/${encodeURIComponent(trip.id)}/bilties`, {
        method: "POST",
        body: JSON.stringify({ number: value }),
      });
      setNumber("");
      await onReload();
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const toggleBilty = async (bilty) => {
    try {
      setError("");
      await apiRequest(
        `/trips/${encodeURIComponent(trip.id)}/bilties/${bilty.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: bilty.status === "Received" ? "Pending" : "Received",
          }),
        },
      );
      await onReload();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="bilty-cell">
      {bilties.map((bilty) => (
        <label className={`bilty-item ${bilty.status === "Received" ? "received" : ""}`} key={bilty.id}>
          <input type="checkbox" checked={bilty.status === "Received"} onChange={() => toggleBilty(bilty)} />
          <span>{bilty.number}</span>
          <em>{bilty.status}</em>
        </label>
      ))}
      <form className="bilty-add" onSubmit={addBilty}>
        <input value={number} onChange={(event) => setNumber(event.target.value)} placeholder="Add bilty no." aria-label={`Add bilty number for ${trip.id}`} />
        <button type="submit">+</button>
      </form>
      {error && <small className="bilty-error">{error}</small>}
    </div>
  );
}

export default function DocumentsTracker({ trips, onUpdateTracking }) {
  const [branchFilter, setBranchFilter] = useState("all");
  const [podFilter, setPodFilter] = useState("all");
  const [billFilter, setBillFilter] = useState("all");
  const [bilties, setBilties] = useState({});
  const loadBilties = async () => {
    const entries = await Promise.all(
      trips.map(async (trip) => {
        const { bilties: rows } = await apiRequest(`/trips/${encodeURIComponent(trip.id)}/bilties`);
        return [trip.id, rows];
      }),
    );
    setBilties(Object.fromEntries(entries));
  };
  useEffect(() => {
    loadBilties().catch(() => setBilties({}));
  }, [trips]);
  const visibleTrips = useMemo(
    () =>
      trips.filter(
        (trip) =>
          (branchFilter === "all" || trip.branch === branchFilter) &&
          (podFilter === "all" || trip.podStatus === podFilter) &&
          (billFilter === "all" || trip.clientBillStatus === billFilter),
      ),
    [trips, branchFilter, podFilter, billFilter],
  );

  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <p className="eyebrow">OPERATIONS CONTROL</p>
          <h1>POD & client bills</h1>
          <p className="subheading">
            Track delivery proof and whether each client bill has been made.
          </p>
        </div>
      </section>
      <section className="panel documents-panel">
        <div className="panel-header documents-header">
          <div>
            <h2>Document status register</h2>
            <p>Change a status directly when POD or billing work is completed.</p>
          </div>
          <div className="filter-row">
            <select className="filter-button" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}>
              <option value="all">All branches</option>
              <option value="Jamshedpur">Jamshedpur</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>
            <select className="filter-button" value={podFilter} onChange={(event) => setPodFilter(event.target.value)}>
              <option value="all">All POD</option>
              <option value="Pending">POD pending</option>
              <option value="Received">POD received</option>
            </select>
            <select className="filter-button" value={billFilter} onChange={(event) => setBillFilter(event.target.value)}>
              <option value="all">All client bills</option>
              <option value="Not made">Bill not made</option>
              <option value="Made">Bill made</option>
            </select>
          </div>
        </div>
        <div className="table-wrap documents-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Trip</th>
                <th>Branch</th>
                <th>Client / route</th>
                <th>Amount</th>
                <th>POD status</th>
                <th>Client bill</th>
                <th>Bilty numbers</th>
              </tr>
            </thead>
            <tbody>
              {visibleTrips.map((trip) => (
                <tr key={trip.id}>
                  <td><strong>{trip.id}</strong><small>{trip.date}</small></td>
                  <td><span className={`branch-badge ${trip.branch === "Maharashtra" ? "maharashtra" : "jamshedpur"}`}>{branchName(trip)}</span></td>
                  <td><strong>{trip.clientName || trip.receiver || "—"}</strong><small>{trip.from} to {trip.to}</small></td>
                  <td>{money(trip.booking)}</td>
                  <td>
                    <select className={`document-status ${trip.podStatus === "Received" ? "complete" : "pending"}`} value={trip.podStatus || "Pending"} onChange={(event) => onUpdateTracking(trip, { podStatus: event.target.value })}>
                      <option value="Pending">Pending</option>
                      <option value="Received">Received</option>
                    </select>
                  </td>
                  <td><BiltyCell trip={trip} bilties={bilties[trip.id] || []} onReload={loadBilties} /></td>
                  <td>
                    <select className={`document-status ${trip.clientBillStatus === "Made" ? "complete" : "pending"}`} value={trip.clientBillStatus || "Not made"} onChange={(event) => onUpdateTracking(trip, { clientBillStatus: event.target.value })}>
                      <option value="Not made">Not made</option>
                      <option value="Made">Made</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleTrips.length === 0 && <div className="empty-state">No records match these filters.</div>}
        </div>
      </section>
    </div>
  );
}
