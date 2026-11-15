import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import NewTripModal from "./components/NewTripModal";
import { apiRequest, clearSessionToken } from "./api";
import BillsPayments from "./pages/BillsPayments";
import Overview from "./pages/Overview";
import Reports from "./pages/Reports";
import DocumentsTracker from "./pages/DocumentsTracker";
import TripRegister from "./pages/TripRegister";
import AuthPage from "./pages/AuthPage";
import "./styles/app.css";

const emptyForm = {
  branch: "Jamshedpur",
  date: "",
  reportingDate: "",
  unloadingDate: "",
  clientName: "",
  vehicle: "",
  from: "",
  to: "",
  weight: "",
  freight: "",
  booking: "",
  advance: "",
  challan: "",
  owner: "",
  phone: "",
  driverPhone: "",
  status: "In transit",
  podStatus: "Pending",
  clientBillStatus: "Not made",
};

const toDateInputValue = (value) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

function formatTripDate(value) {
  if (!value) return "25 Oct 2026";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normaliseTrip(trip) {
  return {
    ...trip,
    date: /^\d{4}-\d{2}-\d{2}$/.test(trip.date)
      ? formatTripDate(trip.date)
      : trip.date,
    reportingDate: /^\d{4}-\d{2}-\d{2}$/.test(trip.reportingDate)
      ? formatTripDate(trip.reportingDate)
      : trip.reportingDate || "",
    unloadingDate: /^\d{4}-\d{2}-\d{2}$/.test(trip.unloadingDate)
      ? formatTripDate(trip.unloadingDate)
      : trip.unloadingDate || "",
  };
}

function editableTripPayload(form) {
  return {
    branch: form.branch,
    date: toDateInputValue(form.date),
    reportingDate: toDateInputValue(form.reportingDate),
    unloadingDate: toDateInputValue(form.unloadingDate),
    clientName: String(form.clientName || "").trim(),
    vehicle: String(form.vehicle || "").trim(),
    from: String(form.from || "").trim(),
    to: String(form.to || "").trim(),
    weight: Number.parseFloat(String(form.weight || "").replace(" MT", "")) || 0,
    freight: Number(form.freight || 0),
    booking: Number(form.booking || 0),
    advance: Number(form.advance || 0),
    challan: Number(form.challan || 0),
    receiver: String(form.receiver || "").trim(),
    owner: String(form.owner || "").trim(),
    phone: String(form.phone || "").trim(),
    driverPhone: String(form.driverPhone || "").trim(),
    status: form.status,
    podStatus: form.podStatus,
    clientBillStatus: form.clientBillStatus,
  };
}

function normaliseSearchText(value) {
  return String(value ?? "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function tripMatchesSearch(trip, searchQuery) {
  const tokens = normaliseSearchText(searchQuery).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const searchableText = normaliseSearchText(
    [
      trip.id,
      trip.branch,
      trip.date,
      trip.reportingDate,
      trip.unloadingDate,
      trip.clientName,
      trip.vehicle,
      trip.from,
      trip.to,
      trip.weight,
      trip.freight,
      trip.booking,
      trip.advance,
      trip.challan,
      trip.receiver,
      trip.owner,
      trip.phone,
      trip.driverPhone,
      trip.status,
      trip.podStatus,
      trip.clientBillStatus,
    ].join(" "),
  );

  return tokens.every((token) => searchableText.includes(token));
}

function AuthOnly({ authenticated, children }) {
  return authenticated ? children : <Navigate to="/login" replace />;
}

function GuestOnly({ authenticated, children }) {
  return authenticated ? <Navigate to="/" replace /> : children;
}

function App() {
  const [trips, setTrips] = useState([]);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [editingTrip, setEditingTrip] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem("om-authenticated") === "true",
  );
  const navigate = useNavigate();
  const filteredTrips = useMemo(
    () => trips.filter((trip) => tripMatchesSearch(trip, query)),
    [trips, query],
  );

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  useEffect(() => {
    if (!authenticated) return;
    apiRequest("/auth/me")
      .then(({ user }) => {
        setCurrentUser(user);
        return apiRequest("/trips");
      })
      .then(({ trips: storedTrips }) => setTrips(storedTrips.map(normaliseTrip)))
      .catch((error) => {
        if (error.status === 401) {
          localStorage.removeItem("om-authenticated");
          clearSessionToken();
          setAuthenticated(false);
          setTrips([]);
          navigate("/login");
          return;
        }
        showToast(error.message);
      });
  }, [authenticated, navigate]);

  const handleAuthenticate = (user) => {
    localStorage.setItem("om-authenticated", "true");
    setCurrentUser(user);
    setAuthenticated(true);
    navigate("/");
  };

  const handleLogout = () => {
    apiRequest("/auth/logout").catch(() => {});
    localStorage.removeItem("om-authenticated");
    clearSessionToken();
    setCurrentUser(null);
    setAuthenticated(false);
    setQuery("");
    navigate("/login");
  };

  const saveTrip = async (form) => {
    try {
      const { trip } = await apiRequest("/trips", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const storedTrip = normaliseTrip(trip);
      setTrips((currentTrips) => [storedTrip, ...currentTrips]);
      navigate("/trips");
      showToast(`${storedTrip.id} added to trip register`);
    } catch (error) {
      showToast(error.message);
    }
  };

  const updateAdvance = async (tripId, advance) => {
    try {
      const { trip } = await apiRequest(`/trips/${encodeURIComponent(tripId)}/advance`, {
        method: "PATCH",
        body: JSON.stringify({ advance: Number(advance) }),
      });
      const storedTrip = normaliseTrip(trip);
      setTrips((currentTrips) =>
        currentTrips.map((currentTrip) =>
          currentTrip.id === tripId ? storedTrip : currentTrip,
        ),
      );
      showToast(`${tripId} advance amount updated`);
    } catch (error) {
      showToast(error.message);
    }
  };

  const startEditingTrip = (trip) => {
    setEditingTrip({
      ...trip,
      clientName: trip.clientName || "",
      date: toDateInputValue(trip.date),
      reportingDate: toDateInputValue(trip.reportingDate),
      unloadingDate: toDateInputValue(trip.unloadingDate),
      weight: String(trip.weight).replace(" MT", ""),
      driverPhone: trip.driverPhone || "",
      phone: trip.phone || "",
    });
  };

  const saveEditedTrip = async (form) => {
    try {
      const { trip } = await apiRequest(
        `/trips/${encodeURIComponent(editingTrip.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(editableTripPayload(form)),
        },
      );
      const storedTrip = normaliseTrip(trip);
      setTrips((currentTrips) =>
        currentTrips.map((currentTrip) =>
          currentTrip.id === editingTrip.id ? storedTrip : currentTrip,
        ),
      );
      setEditingTrip(null);
      showToast(`${editingTrip.id} details updated`);
    } catch (error) {
      showToast(error.message);
    }
  };

  const updateTracking = async (trip, changes) => {
    try {
      const { trip: updatedTrip } = await apiRequest(
        `/trips/${encodeURIComponent(trip.id)}`,
        { method: "PATCH", body: JSON.stringify({ ...editableTripPayload(trip), ...changes }) },
      );
      const storedTrip = normaliseTrip(updatedTrip);
      setTrips((currentTrips) =>
        currentTrips.map((currentTrip) =>
          currentTrip.id === trip.id ? storedTrip : currentTrip,
        ),
      );
      showToast(`${trip.id} tracking details updated`);
    } catch (error) {
      showToast(error.message);
    }
  };

  return (
    <>
      <Routes>
        <Route
          element={
            <AuthOnly authenticated={authenticated}>
              <Layout
                query={query}
                setQuery={setQuery}
                tripCount={trips.length}
                onNewTrip={() => navigate("/trips/new")}
                onLogout={handleLogout}
                user={currentUser}
              />
            </AuthOnly>
          }
        >
          <Route
            index
            element={
              <Overview
                trips={trips}
                visibleTrips={filteredTrips}
                user={currentUser}
                onNewTrip={() => navigate("/trips/new")}
                onUpdateAdvance={updateAdvance}
                onEditTrip={startEditingTrip}
              />
            }
          />
          <Route
            path="trips"
            element={
              <TripRegister
                trips={filteredTrips}
                onNewTrip={() => navigate("/trips/new")}
                onUpdateAdvance={updateAdvance}
                onEditTrip={startEditingTrip}
              />
            }
          />
          <Route
            path="bills"
            element={<BillsPayments trips={filteredTrips} />}
          />
          <Route path="reports" element={<Reports trips={filteredTrips} />} />
          <Route
            path="documents"
            element={
              <DocumentsTracker
                trips={filteredTrips}
                onUpdateTracking={updateTracking}
              />
            }
          />
        </Route>
        <Route
          path="trips/new"
          element={
            <AuthOnly authenticated={authenticated}>
              <NewTripModal
                initialValues={emptyForm}
                onClose={() => navigate(-1)}
                onSave={saveTrip}
              />
            </AuthOnly>
          }
        />
        <Route
          path="/login"
          element={
            <GuestOnly authenticated={authenticated}>
              <AuthPage mode="login" onAuthenticate={handleAuthenticate} />
            </GuestOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestOnly authenticated={authenticated}>
              <AuthPage mode="signup" onAuthenticate={handleAuthenticate} />
            </GuestOnly>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {toast && <div className="toast">✓ {toast}</div>}
      {editingTrip && (
        <NewTripModal
          initialValues={editingTrip}
          title="Edit trip details"
          submitLabel="Save changes"
          onClose={() => setEditingTrip(null)}
          onSave={saveEditedTrip}
        />
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
