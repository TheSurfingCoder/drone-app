import { useState } from 'react';
import { DateTime } from 'luxon';
import React from 'react';

export default function SunControlPanel({ onDateTimeChange }) {
  const [date, setDate] = useState("2023-07-01");
  const [time, setTime] = useState("12:00");
  const [timezone, setTimezone] = useState("UTC");

  const handleChange = (d, t, tz) => {
    const [hour, minute] = t.split(":").map(Number);
    const dt = DateTime.fromISO(`${d}T${t}`, { zone: tz });

    if (dt.isValid) {
      const utcDate = dt.toUTC().toJSDate();
      console.log("🕒 Luxon UTC DateTime:", dt.toUTC().toISO());
      console.log("🕒 UTC JS Date passed to Cesium:", utcDate.toISOString());
      onDateTimeChange(utcDate);

    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    handleChange(newDate, time, timezone);
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTime(newTime);
    handleChange(date, newTime, timezone);
  };

  const handleTimezoneChange = (e) => {
    const newTZ = e.target.value;
    setTimezone(newTZ);
    handleChange(date, time, newTZ);
  };

  return (
    <div className="bg-white px-3 py-2 rounded shadow text-xs">
      <label className="block font-medium text-gray-700 mb-1">Simulate Sun Conditions</label>
      <div className="flex flex-col gap-2">
        <input type="date" value={date} onChange={handleDateChange} />
        <input type="time" value={time} onChange={handleTimeChange} step="900" />
        <select value={timezone} onChange={handleTimezoneChange}>
          <option value="UTC">UTC</option>
          <option value="America/Los_Angeles">PST (San Francisco)</option>
          <option value="America/New_York">EST (New York)</option>
          <option value="Europe/London">GMT (London)</option>
          <option value="Asia/Tokyo">JST (Tokyo)</option>
        </select>
      </div>
    </div>
  );
}
