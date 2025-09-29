"use client";

import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Droplet, Leaf, Bean, Bug, Package, Axe } from "lucide-react";
import clsx from "clsx";

type ActivityType = "Watering" | "Fertilizer" | "Sowing" | "Pesticide" | "Harvest" | "Other";

interface LogEntry {
  date: Date;
  activity: ActivityType;
  details: string;
}

interface AlertEntry {
  date: Date;
  message: string;
}

const activityIcons = {
  Watering: <Droplet className="inline w-4 h-4 mr-1 text-blue-600" />,
  Fertilizer: <Package className="inline w-4 h-4 mr-1 text-yellow-600" />,
  Sowing: <Bean className="inline w-4 h-4 mr-1 text-green-600" />,
  Pesticide: <Bug className="inline w-4 h-4 mr-1 text-red-600" />,
  Harvest: <Axe className="inline w-4 h-4 mr-1 text-orange-600" />,
  Other: <Leaf className="inline w-4 h-4 mr-1 text-gray-600" />,
};

export function FieldLog() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activity, setActivity] = useState<ActivityType>("Watering");
  const [details, setDetails] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);

  // Mock auto-alerts for demonstration
  const activityAlerts: Record<ActivityType, { daysLater: number; message: string }> = {
    Watering: { daysLater: 2, message: "Reminder: Water the crop again" },
    Fertilizer: { daysLater: 5, message: "Reminder: Apply fertilizer" },
    Sowing: { daysLater: 3, message: "Check irrigation for new sowing" },
    Pesticide: { daysLater: 7, message: "Check for pest outbreak" },
    Harvest: { daysLater: 0, message: "Prepare for harvest activities" },
    Other: { daysLater: 1, message: "Follow-up activity" },
  };

  const handleAddLog = () => {
    if (!details.trim()) {
      alert("Please fill in the required field for the selected activity.");
      return;
    }

    const newLog: LogEntry = { date: selectedDate!, activity, details };
    setLogs([...logs, newLog]);

    // Add auto-alert if defined
    const alert = activityAlerts[activity];
    if (alert.daysLater > 0) {
      const alertDate = new Date(selectedDate!);
      alertDate.setDate(alertDate.getDate() + alert.daysLater);
      setAlerts([...alerts, { date: alertDate, message: alert.message }]);
    }

    // Reset form
    setActivity("Watering");
    setDetails("");
    setShowModal(false);
  };

  const getTileContent = (date: Date) => {
    const dayLogs = logs.filter((log) => log.date.toDateString() === date.toDateString());
    const dayAlerts = alerts.filter((alert) => alert.date.toDateString() === date.toDateString());

    if (dayLogs.length === 0 && dayAlerts.length === 0) return null;

    return (
      <div className="mt-1 flex flex-col gap-1">
        {dayLogs.map((log, idx) => (
          <div
            key={idx}
            className={clsx(
              "text-xs rounded px-1 py-0.5 flex items-center truncate font-medium",
              {
                "bg-blue-100 text-blue-800": log.activity === "Watering",
                "bg-yellow-100 text-yellow-800": log.activity === "Fertilizer",
                "bg-green-100 text-green-800": log.activity === "Sowing",
                "bg-red-100 text-red-800": log.activity === "Pesticide",
                "bg-orange-100 text-orange-800": log.activity === "Harvest",
                "bg-gray-100 text-gray-800": log.activity === "Other",
              }
            )}
            title={log.details}
          >
            {activityIcons[log.activity]} {log.activity}
          </div>
        ))}
        {dayAlerts.map((alert, idx) => (
          <div key={idx} className="text-xs text-red-600 truncate font-semibold" title={alert.message}>
            ⚠ {alert.message}
          </div>
        ))}
      </div>
    );
  };

  const getDetailsPlaceholder = () => {
    switch (activity) {
      case "Watering":
        return "Enter amount (liters) or irrigation type...";
      case "Fertilizer":
        return "Enter type and quantity (kg)...";
      case "Sowing":
        return "Enter seeds per row or area...";
      case "Pesticide":
        return "Enter type and dosage...";
      case "Harvest":
        return "Enter estimated yield...";
      default:
        return "Enter notes...";
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-3xl font-bold mb-6">Field Calendar</h2>

      <div className="max-w-full mx-auto">
        <Calendar
          onClickDay={(date) => {
            setSelectedDate(date);
            setShowModal(true);
          }}
          tileContent={({ date, view }) => view === "month" && getTileContent(date)}
          className="h-[750px] w-full border rounded-lg shadow-xl"
        />
      </div>

      {showModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-2xl w-96 p-6 space-y-4 animate-scale-up">
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              Log Activity - {selectedDate.toDateString()}
            </h3>

            <div>
              <label className="block font-semibold mb-1 text-gray-700">Activity Type</label>
              <select
                className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                value={activity}
                onChange={(e) => setActivity(e.target.value as ActivityType)}
              >
                {Object.keys(activityIcons).map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-gray-700">{activity} Details</label>
              <input
                type="text"
                className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder={getDetailsPlaceholder()}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                onClick={handleAddLog}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease-in-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.2s ease-in-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
