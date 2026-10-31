import React from "react";
import { money, tripBalance } from "../data/trips";
import "../styles/bills-payments.css";

export default function BillsPayments({ trips }) {
  const outstanding = trips.filter((trip) => trip.status !== "Paid");
  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <p className="eyebrow">FINANCE</p>
          <h1>Bills & payments</h1>
          <p className="subheading">
            Review booking amounts, advances, challans, and balances.
          </p>
        </div>
      </section>
      <section className="bill-summary">
        <div className="panel summary-tile">
          <span>Outstanding bills</span>
          <strong>{outstanding.length}</strong>
          <small>Trips awaiting final settlement</small>
        </div>
        <div className="panel summary-tile">
          <span>Total outstanding</span>
          <strong>
            {money(
              outstanding.reduce((sum, trip) => sum + tripBalance(trip), 0),
            )}
          </strong>
          <small>Booking minus advance and challan</small>
        </div>
      </section>
      <section className="panel bill-list">
        <div className="panel-header">
          <div>
            <h2>Payment queue</h2>
            <p>Trips that still need a payment or POD update.</p>
          </div>
        </div>
        {outstanding.map((trip) => (
          <div className="bill-row" key={trip.id}>
            <div>
              <strong>
                {trip.id} · {trip.receiver}
              </strong>
              <span
                className={`branch-badge ${trip.branch === "Maharashtra" ? "maharashtra" : "jamshedpur"}`}
              >
                {trip.branch === "Maharashtra" ? "Maharashtra" : "Jamshedpur"}
              </span>
              <small>
                {trip.from} to {trip.to}
              </small>
            </div>
            <span>{money(tripBalance(trip))}</span>
            <span
              className={`status ${trip.status.toLowerCase().replaceAll(" ", "-")}`}
            >
              {trip.status}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
