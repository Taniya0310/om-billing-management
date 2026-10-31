import React, { useEffect, useMemo, useState } from "react";
import { money, tripBalance } from "../data/trips";
import Icon from "../components/Icon";
import StatCard from "../components/StatCard";
import TripTable from "../components/TripTable";
import "../styles/overview.css";

const quoteGroups = [
  [
    "Every well-managed trip is one step closer to a stronger business.",
    "Consistency in small details creates confidence in every client.",
    "Keep moving forward; every completed delivery builds your reputation.",
  ],
  [
    "Great businesses grow when every promise is tracked and delivered.",
    "A clear record today creates a smoother decision tomorrow.",
    "Progress is built one organised trip, bill, and client at a time.",
  ],
  [
    "Your attention to detail is the engine behind your business growth.",
    "Strong operations turn everyday work into lasting success.",
    "Lead with discipline, serve with care, and let your results speak.",
  ],
  [
    "Every challenge on the road is an opportunity to improve the journey.",
    "Reliable service is not an act; it is a habit built every day.",
    "Keep your records clear and your goals clear — momentum will follow.",
  ],
];

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function getGreeting(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export default function Overview({
  trips,
  visibleTrips = trips,
  user,
  onNewTrip,
  onUpdateAdvance,
  onEditTrip,
}) {
  const adminName = user?.name || user?.email?.split("@")[0] || "Admin";
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(clock);
  }, []);

  const totalFreight = trips.reduce((sum, trip) => sum + trip.freight, 0);
  const totalBalance = trips.reduce((sum, trip) => sum + tripBalance(trip), 0);
  const pendingPod = trips.filter(
    (trip) => trip.status === "Pending POD",
  ).length;
  const dateLabel = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const dailyQuotes = useMemo(
    () => quoteGroups[getDayOfYear(now) % quoteGroups.length],
    [now],
  );

  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Live dashboard · {dateLabel}</p>
          <h1>{getGreeting(now.getHours())}, {adminName}</h1>
          <p className="subheading">
            Here’s what’s happening with your trips and bills today.
          </p>
        </div>
        <button className="primary-button" onClick={onNewTrip}>
          <Icon name="plus" />
          New trip
        </button>
      </section>
      <section
        className="motivation-grid"
        aria-label="Daily business motivation"
      >
        {dailyQuotes.map((quote, index) => (
          <article className="motivation-card" key={quote}>
            <span className="motivation-number">0{index + 1}</span>
            <p>{quote}</p>
          </article>
        ))}
      </section>
      <section className="stats-grid">
        <StatCard
          label="Total freight value"
          value={money(totalFreight)}
          note="↑ 12.4% from last month"
          tone="orange"
          icon="chart"
        />
        <StatCard
          label="Outstanding balance"
          value={money(totalBalance)}
          note="Across active trips"
          tone="blue"
          icon="file"
        />
        <StatCard
          label="Trips this month"
          value={trips.length}
          note="↑ 8.1% from last month"
          tone="green"
          icon="truck"
        />
        <StatCard
          label="Awaiting POD"
          value={pendingPod}
          note="Needs your attention"
          tone="purple"
          icon="bell"
        />
      </section>
      <section className="content-grid">
        <div className="panel recent-panel">
          <div className="panel-header">
            <div>
              <h2>Recent trips</h2>
              <p>Your latest trip entries and their billing status.</p>
            </div>
            <a className="text-button" href="/trips">
              View all <Icon name="arrow" />
            </a>
          </div>
          <TripTable
            trips={visibleTrips.slice(0, 4)}
            onUpdateAdvance={onUpdateAdvance}
            onEditTrip={onEditTrip}
          />
        </div>
        <div className="panel attention-panel">
          <div className="panel-header">
            <div>
              <h2>Quick actions</h2>
              <p>Common tasks for your day.</p>
            </div>
          </div>
          <div className="quick-actions">
            <button onClick={onNewTrip}>
              <span className="quick-icon orange">
                <Icon name="plus" />
              </span>
              <span>
                <strong>Add a new trip</strong>
                <small>Record trip and freight details</small>
              </span>
              <Icon name="arrow" />
            </button>
            <a href="/bills">
              <span className="quick-icon blue">
                <Icon name="file" />
              </span>
              <span>
                <strong>Review outstanding bills</strong>
                <small>
                  {trips.filter((trip) => trip.status !== "Paid").length} bills
                  need attention
                </small>
              </span>
              <Icon name="arrow" />
            </a>
            <a href="/reports">
              <span className="quick-icon green">
                <Icon name="chart" />
              </span>
              <span>
                <strong>View monthly report</strong>
                <small>See your billing summary</small>
              </span>
              <Icon name="arrow" />
            </a>
          </div>
          <div className="mini-note">
            <div className="note-icon">✦</div>
            <div>
              <strong>Stay on top of PODs</strong>
              <p>
                Upload proof of delivery as soon as a trip is complete to keep
                billing moving.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
