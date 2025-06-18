// app/components/LogVisualization.tsx
"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Calendar, TrendingUp, AlertTriangle, Info } from "lucide-react";

interface LogEvent {
  timestamp: number;
  message: string;
  logStreamName: string;
  eventId: string;
  ingestionTime: number;
}

interface LogVisualizationProps {
  logEvents: LogEvent[];
}

export default function LogVisualization({ logEvents }: LogVisualizationProps) {
  const [selectedView, setSelectedView] = useState<
    "timeline" | "streams" | "levels" | "stats"
  >("timeline");

  // Process data for timeline visualization
  const timelineData = useMemo(() => {
    if (!logEvents.length) return [];

    const hourlyData = logEvents.reduce(
      (acc, event) => {
        const hour = new Date(event.timestamp);
        hour.setMinutes(0, 0, 0);
        const hourKey = hour.toISOString();

        if (!acc[hourKey]) {
          acc[hourKey] = {
            time: hour.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            fullTime: hour.toLocaleString(),
            count: 0,
            errors: 0,
            warnings: 0,
            info: 0,
          };
        }

        acc[hourKey].count++;

        // Categorize by log level (simple keyword matching)
        const message = event.message.toLowerCase();
        if (message.includes("error") || message.includes("fatal")) {
          acc[hourKey].errors++;
        } else if (message.includes("warn")) {
          acc[hourKey].warnings++;
        } else if (message.includes("info")) {
          acc[hourKey].info++;
        }

        return acc;
      },
      {} as Record<
        string,
        {
          time: string;
          fullTime: string;
          count: number;
          errors: number;
          warnings: number;
          info: number;
        }
      >
    );

    return Object.values(hourlyData).sort(
      (a, b) => new Date(a.fullTime).getTime() - new Date(b.fullTime).getTime()
    );
  }, [logEvents]);

  // Process data for log stream distribution
  const streamData = useMemo(() => {
    if (!logEvents.length) return [];

    const streamCounts = logEvents.reduce((acc, event) => {
      const streamName = event.logStreamName || "Unknown";
      acc[streamName] = (acc[streamName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(streamCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 streams
  }, [logEvents]);

  // Process data for log level distribution
  const levelData = useMemo(() => {
    if (!logEvents.length) return [];

    const levels = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, OTHER: 0 };

    logEvents.forEach((event) => {
      const message = event.message.toLowerCase();
      if (message.includes("error") || message.includes("fatal")) {
        levels.ERROR++;
      } else if (message.includes("warn")) {
        levels.WARN++;
      } else if (message.includes("info")) {
        levels.INFO++;
      } else if (message.includes("debug")) {
        levels.DEBUG++;
      } else {
        levels.OTHER++;
      }
    });

    return Object.entries(levels)
      .filter(([, count]) => count > 0)
      .map(([level, count]) => ({ level, count }));
  }, [logEvents]);

  // Statistics
  const stats = useMemo(() => {
    if (!logEvents.length) return null;

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentEvents = logEvents.filter(
      (event) => event.timestamp > oneHourAgo
    );

    const errorCount = logEvents.filter(
      (event) =>
        event.message.toLowerCase().includes("error") ||
        event.message.toLowerCase().includes("fatal")
    ).length;

    const uniqueStreams = new Set(logEvents.map((event) => event.logStreamName))
      .size;

    const timeSpan =
      logEvents.length > 1
        ? Math.max(...logEvents.map((e) => e.timestamp)) -
          Math.min(...logEvents.map((e) => e.timestamp))
        : 0;

    return {
      total: logEvents.length,
      recentCount: recentEvents.length,
      errorCount,
      uniqueStreams,
      timeSpanHours: Math.round((timeSpan / (1000 * 60 * 60)) * 10) / 10,
      avgPerHour:
        timeSpan > 0
          ? Math.round(
              (logEvents.length / (timeSpan / (1000 * 60 * 60))) * 10
            ) / 10
          : 0,
    };
  }, [logEvents]);

  const colors = [
    "#3B82F6",
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#8B5CF6",
    "#F97316",
  ];

  if (!logEvents.length) {
    return (
      <div className="bg-white border rounded-lg p-6 text-center text-gray-500">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No data available for visualization</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Log Analytics</h3>
          <div className="flex gap-2">
            {[
              { key: "stats", label: "Stats", icon: Info },
              { key: "timeline", label: "Timeline", icon: Calendar },
              { key: "streams", label: "Streams", icon: TrendingUp },
              { key: "levels", label: "Levels", icon: AlertTriangle },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() =>
                  setSelectedView(
                    key as "stats" | "timeline" | "streams" | "levels"
                  )
                }
                className={`px-3 py-1 text-sm rounded-md flex items-center gap-1 ${
                  selectedView === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {selectedView === "stats" && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    Total Events
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.total.toLocaleString()}
                  </p>
                </div>
                <Info className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">
                    Error Events
                  </p>
                  <p className="text-2xl font-bold text-red-900">
                    {stats.errorCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-red-600">
                    {((stats.errorCount / stats.total) * 100).toFixed(1)}% of
                    total
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">
                    Recent (1h)
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {stats.recentCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600">
                    {((stats.recentCount / stats.total) * 100).toFixed(1)}% of
                    total
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">
                    Unique Streams
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.uniqueStreams}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">
                    Time Span
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats.timeSpanHours}h
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 font-medium">
                    Avg per Hour
                  </p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {stats.avgPerHour}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-indigo-500" />
              </div>
            </div>
          </div>
        )}

        {selectedView === "timeline" && (
          <div>
            <h4 className="text-md font-medium mb-4">Log Events Over Time</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.fullTime;
                      }
                      return value;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Total Events"
                  />
                  <Line
                    type="monotone"
                    dataKey="errors"
                    stroke="#EF4444"
                    strokeWidth={2}
                    name="Errors"
                  />
                  <Line
                    type="monotone"
                    dataKey="warnings"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="Warnings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedView === "streams" && (
          <div>
            <h4 className="text-md font-medium mb-4">
              Top Log Streams by Event Count
            </h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={streamData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedView === "levels" && (
          <div>
            <h4 className="text-md font-medium mb-4">Log Level Distribution</h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={levelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ level, count, percent }) =>
                      `${level}: ${count} (${(percent * 100).toFixed(1)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {levelData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
