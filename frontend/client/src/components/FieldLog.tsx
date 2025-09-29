"use client";

import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import clsx from "clsx";

type ActivityType = "Watering" | "Fertilizer" | "Sowing" | "Pesticide" | "Harvest" | "Other";

interface LogEntry {
  date: Date;
  activity: ActivityType;
  intensity: string;
  notes: string;
}

export function FieldLog() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activity, setActivity] = useState<ActivityType>("Watering");
  const [intensity, setIntensity] = useState("");
  const [notes, setNotes] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const handleAddLog = () => {
    if (!intensity && !notes) {
      alert("Please enter either intensity or notes.");
      return;
    }

    const newLog: LogEntry = {
      date: selectedDate,
      activity,
      intensity,
      notes,
    };

    setLogs([...logs, newLog]);
    setIntensity("");
    setNotes("");
    alert("✅ Log added!");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Field Log</h2>

      {/* Calendar */}
      <div className="mb-6">
        <Calendar
          onChange={(date: Date) => setSelectedDate(date)}
          value={selectedDate}
          className="border rounded-lg shadow-md"
        />
      </div>

      {/* Log Form */}
      <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <div>
          <label className="block font-semibold mb-1">Activity Type</label>
          <select
            className="w-full border rounded p-2"
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityType)}
          >
            <option value="Watering">Watering</option>
            <option value="Fertilizer">Fertilizer</option>
            <option value="Sowing">Sowing</option>
            <option value="Pesticide">Pesticide</option>
            <option value="Harvest">Harvest</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Intensity / Quantity</label>
          <input
            type="text"
            placeholder="e.g., 5 liters, 2 kg"
            className="w-full border rounded p-2"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Notes / Observations</label>
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            placeholder="Optional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>

        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          onClick={handleAddLog}
        >
          Add Log
        </button>
      </div>

      {/* Logs Display */}
      <div className="mt-6 space-y-4">
        <h3 className="text-xl font-bold">Past Logs</h3>
        {logs.length === 0 && <p className="text-gray-500">No logs yet.</p>}

        {logs.map((log, idx) => (
          <div
            key={idx}
            className="border rounded p-4 bg-gray-50 shadow-sm"
          >
            <p className="text-gray-700">
              <strong>Date:</strong> {log.date.toDateString()}
            </p>
            <p className="text-gray-700">
              <strong>Activity:</strong> {log.activity}
            </p>
            {log.intensity && (
              <p className="text-gray-700">
                <strong>Intensity / Quantity:</strong> {log.intensity}
              </p>
            )}
            {log.notes && (
              <p className="text-gray-700">
                <strong>Notes:</strong> {log.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
