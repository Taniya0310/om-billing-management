import React from "react";
import { money, tripBalance } from "../data/trips";
import "../styles/reports.css";

export default function Reports({ trips }) {
  const totalWeight = trips
    .reduce((sum, trip) => sum + Number.parseFloat(trip.weight), 0)
    .toFixed(2);
  const averageFreight = trips.length
    ? Math.round(
        trips.reduce((sum, trip) => sum + trip.freight, 0) / trips.length,
      )
    : 0;
  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <p className="eyebrow">PERFORMANCE</p>
          <h1>Reports</h1>
          <p className="subheading">
            A clear monthly snapshot of your transport operations.
          </p>
        </div>
      </section>
      <section className="report-grid">
        <div className="panel report-card">
          <span>Total freight booked</span>
          <strong>
            {money(trips.reduce((sum, trip) => sum + trip.freight, 0))}
          </strong>
          <small>Across {trips.length} trips</small>
        </div>
        <div className="panel report-card">
          <span>Total cargo moved</span>
          <strong>{totalWeight} MT</strong>
          <small>Recorded trip weight</small>
        </div>
        <div className="panel report-card">
          <span>Average freight / trip</span>
          <strong>{money(averageFreight)}</strong>
          <small>Monthly average</small>
        </div>
        <div className="panel report-card">
          <span>Balance to collect</span>
          <strong>
            {money(trips.reduce((sum, trip) => sum + tripBalance(trip), 0))}
          </strong>
          <small>Based on booking amounts</small>
        </div>
      </section>
      <section className="panel report-note">
        <h2>Monthly summary</h2>
        <p>
          Your reporting view is ready for the backend connection. The figures
          above are calculated from the trip records currently held in this
          frontend session.
        </p>
      </section>
    </div>
  );
}
