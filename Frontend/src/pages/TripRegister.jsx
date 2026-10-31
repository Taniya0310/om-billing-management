import React, { useMemo, useState } from "react";
import Icon from "../components/Icon";
import TripTable from "../components/TripTable";
import "../styles/trip-register.css";

export default function TripRegister({
  trips,
  onNewTrip,
  onUpdateAdvance,
  onEditTrip,
}) {
  const [dateFilter, setDateFilter] = useState("this-month");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  const visibleTrips = useMemo(() => {
    const now = new Date();
    return trips.filter((trip) => {
      const tripDate = new Date(trip.date);
      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "this-month" &&
          tripDate.getMonth() === now.getMonth() &&
          tripDate.getFullYear() === now.getFullYear()) ||
        (dateFilter === "last-month" &&
          tripDate.getMonth() === (now.getMonth() + 11) % 12 &&
          tripDate.getFullYear() ===
            now.getFullYear() - (now.getMonth() === 0 ? 1 : 0));
      const matchesStatus =
        statusFilter === "all" || trip.status === statusFilter;
      const matchesBranch =
        branchFilter === "all" || trip.branch === branchFilter;
      return matchesDate && matchesStatus && matchesBranch;
    });
  }, [dateFilter, statusFilter, branchFilter, trips]);

  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <p className="eyebrow">TRIP MANAGEMENT</p>
          <h1>Trip register</h1>
          <p className="subheading">
            Keep your trip records, bills, and payments organised in one place.
          </p>
        </div>
        <button className="primary-button" onClick={onNewTrip}>
          <Icon name="plus" />
          New trip
        </button>
      </section>
      <section className="panel register-panel">
        <div className="panel-header">
          <div>
            <h2>All trip records</h2>
            <p>Edit any trip detail, status, or advance amount when needed.</p>
          </div>
          <div className="filter-row">
            <label className="filter-control">
              <span className="sr-only">Filter by branch</span>
              <select
                className="filter-button"
                value={branchFilter}
                onChange={(event) => setBranchFilter(event.target.value)}
              >
                <option value="all">All branches</option>
                <option value="Jamshedpur">Jamshedpur</option>
                <option value="Maharashtra">Maharashtra</option>
              </select>
            </label>
            <label className="filter-control">
              <span className="sr-only">Filter by date</span>
              <select
                className="filter-button"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
              >
                <option value="this-month">This month</option>
                <option value="last-month">Last month</option>
                <option value="all">All time</option>
              </select>
            </label>
            <label className="filter-control">
              <span className="sr-only">Filter by status</span>
              <select
                className="filter-button"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All status</option>
                <option value="Pending POD">Pending POD</option>
                <option value="In transit">In transit</option>
                <option value="Paid">Paid</option>
              </select>
            </label>
          </div>
        </div>
        <TripTable
          trips={visibleTrips}
          onUpdateAdvance={onUpdateAdvance}
          onEditTrip={onEditTrip}
        />
      </section>
    </div>
  );
}
