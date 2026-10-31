import React from "react";

export default function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <em>*</em>}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
