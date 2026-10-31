import React, { useState } from "react";
import { money } from "../data/trips";
import Field from "./Field";
import Icon from "./Icon";

export default function NewTripModal({
  initialValues,
  title = "Add a new trip",
  submitLabel = "Save trip",
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(initialValues);
  const [advanceEdited, setAdvanceEdited] = useState(false);
  const setField = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const setBooking = (event) => {
    const value = event.target.value;
    setForm((current) => ({
      ...current,
      booking: value,
      ...(advanceEdited
        ? {}
        : { advance: value === "" ? "" : String(Number(value) * 0.9) }),
    }));
  };
  const setAdvance = (event) => {
    setAdvanceEdited(true);
    setForm((current) => ({ ...current, advance: event.target.value }));
  };
  const calculatedBalance =
    Number(form.booking || 0) -
    Number(form.advance || 0) -
    Number(form.challan || 0);
  const calculatedProfit =
    Number(form.freight || 0) -
    Number(form.booking || 0) +
    Number(form.challan || 0);
  const submit = (event) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form className="modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">TRIP ENTRY</p>
            <h2>{title}</h2>
            <p>Capture the trip and billing details below.</p>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="form-section">
          <h3>Trip details</h3>
          <div className="form-grid">
            <label className="field">
              <span>Branch</span>
              <select
                value={form.branch || "Jamshedpur"}
                onChange={setField("branch")}
              >
                <option value="Jamshedpur">Jamshedpur (Jsr)</option>
                <option value="Maharashtra">Maharashtra (MH)</option>
              </select>
            </label>
            <Field
              label="Trip date"
              type="date"
              value={form.date}
              onChange={setField("date")}
              required
            />
            <Field
              label="Client name"
              value={form.clientName}
              onChange={setField("clientName")}
              placeholder="Company / client name"
              required
            />
            <Field
              label="Vehicle number"
              value={form.vehicle}
              onChange={setField("vehicle")}
              placeholder="e.g. MH 05 AB 2210"
              required
            />
            <Field
              label="From"
              value={form.from}
              onChange={setField("from")}
              placeholder="Loading point"
              required
            />
            <Field
              label="To"
              value={form.to}
              onChange={setField("to")}
              placeholder="Delivery destination"
              required
            />
            <Field
              label="Weight (MT)"
              type="number"
              value={form.weight}
              onChange={setField("weight")}
              placeholder="e.g. 18.10"
              required
            />
          </div>
        </div>
        <div className="form-section">
          <h3>Billing details</h3>
          <div className="form-grid">
            <Field
              label="Total freight (₹)"
              type="number"
              value={form.freight}
              onChange={setField("freight")}
              placeholder="60,000"
              required
            />
            <Field
              label="Booking amount (₹)"
              type="number"
              value={form.booking}
              onChange={setBooking}
              placeholder="50,000"
              required
            />
            <Field
              label="Advance paid (₹)"
              type="number"
              value={form.advance}
              onChange={setAdvance}
              placeholder="44,500"
              required
            />
            <Field
              label="Challan / other (₹)"
              type="number"
              value={form.challan}
              onChange={setField("challan")}
              placeholder="400"
            />
            <label className="field calculated-field">
              <span>Profit (₹)</span>
              <input value={money(calculatedProfit)} readOnly />
            </label>
          </div>
          <div className="balance-preview">
            <span>Calculated balance</span>
            <strong>{money(calculatedBalance)}</strong>
          </div>
        </div>
        <div className="form-section">
          <h3>Delivery & receiver</h3>
          <div className="form-grid">
            <Field
              label="Transport owner"
              value={form.owner}
              onChange={setField("owner")}
              placeholder="Owner name"
            />
            <Field
              label="Owner phone"
              value={form.phone}
              onChange={setField("phone")}
              placeholder="10-digit mobile number"
            />
            <Field
              label="Driver phone number"
              value={form.driverPhone}
              onChange={setField("driverPhone")}
              placeholder="10-digit mobile number"
            />
            <label className="field">
              <span>Status</span>
              <select
                value={form.status || "In transit"}
                onChange={setField("status")}
              >
                <option value="In transit">In transit</option>
                <option value="Pending POD">Pending POD</option>
                <option value="Paid">Paid</option>
              </select>
            </label>
            <label className="field">
              <span>POD status</span>
              <select value={form.podStatus || "Pending"} onChange={setField("podStatus")}>
                <option value="Pending">Pending</option>
                <option value="Received">Received</option>
              </select>
            </label>
            <label className="field">
              <span>Client bill</span>
              <select value={form.clientBillStatus || "Not made"} onChange={setField("clientBillStatus")}>
                <option value="Not made">Not made</option>
                <option value="Made">Made</option>
              </select>
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="submit">
            <Icon name="edit" />
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
