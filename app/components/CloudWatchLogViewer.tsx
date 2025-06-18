// app/components/CloudWatchLogViewer.tsx
"use client";

import { useState, useEffect, Fragment, ChangeEvent, useRef } from "react";
import {
  Search,
  Download,
  RefreshCw,
  Filter,
  AlertCircle,
  ChevronDown,
  X,
  Info,
} from "lucide-react";
import { Combobox } from "@headlessui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounce, formatTimestamp, exportLogs } from "./utils";

interface LogEvent {
  timestamp: number;
  message: string;
  logStreamName: string;
  eventId: string;
  ingestionTime: number;
}

interface LogGroup {
  logGroupName: string;
  creationTime: number;
  retentionInDays?: number;
  storedBytes?: number;
}

interface LogStream {
  logStreamName: string;
  creationTime: number;
  lastEventTime?: number;
  lastIngestionTime?: number;
  storedBytes?: number;
}

export default function CloudWatchLogViewer() {
  const [logGroups, setLogGroups] = useState<LogGroup[]>([]);
  const [logStreams, setLogStreams] = useState<LogStream[]>([]);
  const [selectedLogGroup, setSelectedLogGroup] = useState<string | null>("");
  const [selectedLogStream, setSelectedLogStream] = useState<string | null>("");
  const [filterPattern, setFilterPattern] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [logEvents, setLogEvents] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // For searchable dropdowns
  const [logGroupQuery, setLogGroupQuery] = useState("");
  const [logStreamQuery, setLogStreamQuery] = useState("");

  // Debounced queries
  const debouncedLogGroupQuery = useDebounce(logGroupQuery, 300);
  const debouncedLogStreamQuery = useDebounce(logStreamQuery, 300);

  // Add state for open and active index for both dropdowns
  const [logGroupOpen, setLogGroupOpen] = useState(false);
  const [logGroupActiveIndex, setLogGroupActiveIndex] = useState(0);
  const [logStreamOpen, setLogStreamOpen] = useState(false);
  const [logStreamActiveIndex, setLogStreamActiveIndex] = useState(0);

  // Fetch log groups on mount
  useEffect(() => {
    fetchLogGroups();
  }, []);

  // Fetch log streams when log group changes
  useEffect(() => {
    if (selectedLogGroup) {
      fetchLogStreams(selectedLogGroup);
    } else {
      setLogStreams([]);
      setSelectedLogStream("");
    }
  }, [selectedLogGroup]);

  // Filtered log groups for search (debounced)
  const filteredLogGroups =
    debouncedLogGroupQuery === ""
      ? logGroups
      : logGroups.filter((group) =>
          group.logGroupName
            .toLowerCase()
            .includes(debouncedLogGroupQuery.toLowerCase())
        );

  // Filtered log streams for search (debounced)
  const filteredLogStreams =
    debouncedLogStreamQuery === ""
      ? logStreams
      : logStreams.filter((stream) =>
          stream.logStreamName
            .toLowerCase()
            .includes(debouncedLogStreamQuery.toLowerCase())
        );

  // Virtualizer for log groups
  const parentRefLogGroup = useRef<HTMLDivElement>(null);
  const logGroupVirtualizer = useVirtualizer({
    count: filteredLogGroups.length,
    getScrollElement: () => parentRefLogGroup.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  // Virtualizer for log streams
  const parentRefLogStream = useRef<HTMLDivElement>(null);
  const logStreamVirtualizer = useVirtualizer({
    count: filteredLogStreams.length,
    getScrollElement: () => parentRefLogStream.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  // Scroll to active index when dropdown opens or active index changes (log group)
  useEffect(() => {
    if (
      logGroupOpen &&
      parentRefLogGroup.current &&
      filteredLogGroups.length > 0
    ) {
      logGroupVirtualizer.scrollToIndex(logGroupActiveIndex);
    }
  }, [logGroupOpen, logGroupActiveIndex, filteredLogGroups.length]);

  // Scroll to active index when dropdown opens or active index changes (log stream)
  useEffect(() => {
    if (
      logStreamOpen &&
      parentRefLogStream.current &&
      filteredLogStreams.length > 0
    ) {
      logStreamVirtualizer.scrollToIndex(logStreamActiveIndex);
    }
  }, [logStreamOpen, logStreamActiveIndex, filteredLogStreams.length]);

  const fetchLogGroups = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cloudwatch");
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch log groups");
      setLogGroups(data.logGroups);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogStreams = async (logGroupName: string) => {
    if (!logGroupName) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cloudwatch", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logGroupName }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch log streams");
      setLogStreams(data.logStreams);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const searchLogs = async () => {
    if (!selectedLogGroup) {
      setError("Please select a log group");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const searchParams = {
        logGroupName: selectedLogGroup,
        ...(selectedLogStream && { logStreamName: selectedLogStream }),
        ...(filterPattern && { filterPattern }),
        ...(startTime && { startTime: new Date(startTime).getTime() }),
        ...(endTime && { endTime: new Date(endTime).getTime() }),
        limit: 100,
      };
      const response = await fetch("/api/cloudwatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchParams),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to search logs");
      setLogEvents(data.events);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Add a clear filters function
  const clearFilters = () => {
    setSelectedLogGroup("");
    setSelectedLogStream("");
    setFilterPattern("");
    setStartTime("");
    setEndTime("");
    setLogEvents([]);
    setLogGroupQuery("");
    setLogStreamQuery("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200">
          <div className="px-8 py-6 border-b border-gray-200 flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              AWS CloudWatch Log Viewer
            </h1>
            <p className="text-gray-700 mt-1 text-base">
              Search and view your AWS CloudWatch logs
            </p>
          </div>

          {/* Search Filters */}
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Search Filters
            </h2>
            <form
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              onSubmit={(e) => {
                e.preventDefault();
                searchLogs();
              }}
            >
              {/* Log Group Dropdown */}
              <div className="col-span-1">
                <div className="flex items-center mb-2 gap-1">
                  <label className="block text-base font-semibold text-gray-800">
                    Log Group
                  </label>
                  <div
                    className="relative group"
                    tabIndex={0}
                    aria-label="Log Group Example"
                    role="button"
                  >
                    <Info className="w-4 h-4 text-gray-400 cursor-pointer group-hover:text-blue-600 group-focus:text-blue-600" />
                    <div
                      className="absolute left-1/2 bottom-full mb-2 z-30 -translate-x-1/2 w-64 rounded-lg bg-gray-900 text-white text-xs px-4 py-2 shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus:pointer-events-auto transition-opacity duration-200"
                      role="tooltip"
                    >
                      Example:{" "}
                      <span className="font-mono">/aws/lambda/my-function</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Combobox
                    value={selectedLogGroup}
                    onChange={(value) => setSelectedLogGroup(value || "")}
                  >
                    <div className="relative">
                      <Combobox.Input
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm transition-all"
                        displayValue={(groupName: string) => groupName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setLogGroupQuery(e.target.value)
                        }
                        placeholder="Search log groups..."
                        autoComplete="off"
                        onFocus={() => setLogGroupOpen(true)}
                        onBlur={() =>
                          setTimeout(() => setLogGroupOpen(false), 100)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "ArrowDown") {
                            setLogGroupOpen(true);
                            setLogGroupActiveIndex((prev) =>
                              Math.min(prev + 1, filteredLogGroups.length - 1)
                            );
                          } else if (e.key === "ArrowUp") {
                            setLogGroupOpen(true);
                            setLogGroupActiveIndex((prev) =>
                              Math.max(prev - 1, 0)
                            );
                          }
                        }}
                      />
                      <Combobox.Button
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setLogGroupOpen((open) => !open)}
                      >
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </Combobox.Button>
                      <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-xl ring-1 ring-black ring-opacity-10 focus:outline-none sm:text-sm border border-gray-200">
                        <div
                          ref={parentRefLogGroup}
                          style={{
                            maxHeight: "15rem",
                            overflow: "auto",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              height: `${logGroupVirtualizer.getTotalSize()}px`,
                              position: "relative",
                            }}
                          >
                            {logGroupVirtualizer
                              .getVirtualItems()
                              .map((virtualRow) => {
                                const group =
                                  filteredLogGroups[virtualRow.index];
                                return (
                                  <div
                                    key={group.logGroupName}
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      width: "100%",
                                      transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                  >
                                    <Combobox.Option
                                      value={group.logGroupName}
                                      className={({ active }) =>
                                        `relative cursor-pointer select-none py-2 pl-4 pr-10 rounded-lg transition-all ${
                                          active
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-900"
                                        }`
                                      }
                                      onMouseEnter={() =>
                                        setLogGroupActiveIndex(virtualRow.index)
                                      }
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span
                                            className={`block truncate ${
                                              selected
                                                ? "font-semibold"
                                                : "font-normal"
                                            }`}
                                          >
                                            {group.logGroupName}
                                          </span>
                                          {selected ? (
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                              ✓
                                            </span>
                                          ) : null}
                                        </>
                                      )}
                                    </Combobox.Option>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                        {filteredLogGroups.length === 0 &&
                          debouncedLogGroupQuery !== "" && (
                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                              No log groups found.
                            </div>
                          )}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                </div>
              </div>

              {/* Log Stream Dropdown */}
              <div className="col-span-1">
                <div className="flex items-center mb-2 gap-1">
                  <label className="block text-base font-semibold text-gray-800">
                    Log Stream{" "}
                    <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div
                    className="relative group"
                    tabIndex={0}
                    aria-label="Log Stream Example"
                    role="button"
                  >
                    <Info className="w-4 h-4 text-gray-400 cursor-pointer group-hover:text-blue-600 group-focus:text-blue-600" />
                    <div
                      className="absolute left-1/2 bottom-full mb-2 z-30 -translate-x-1/2 w-72 rounded-lg bg-gray-900 text-white text-xs px-4 py-2 shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus:pointer-events-auto transition-opacity duration-200"
                      role="tooltip"
                    >
                      Example:{" "}
                      <span className="font-mono">
                        2024/06/01/[$LATEST]abcdef123456
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Combobox
                    value={selectedLogStream}
                    onChange={(value) => setSelectedLogStream(value || "")}
                    disabled={!selectedLogGroup}
                  >
                    <div className="relative">
                      <Combobox.Input
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm transition-all disabled:bg-gray-100"
                        displayValue={(streamName: string) => streamName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setLogStreamQuery(e.target.value)
                        }
                        placeholder="Search log streams..."
                        disabled={!selectedLogGroup}
                        autoComplete="off"
                        onFocus={() => setLogStreamOpen(true)}
                        onBlur={() =>
                          setTimeout(() => setLogStreamOpen(false), 100)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "ArrowDown") {
                            setLogStreamOpen(true);
                            setLogStreamActiveIndex((prev) =>
                              Math.min(prev + 1, filteredLogStreams.length - 1)
                            );
                          } else if (e.key === "ArrowUp") {
                            setLogStreamOpen(true);
                            setLogStreamActiveIndex((prev) =>
                              Math.max(prev - 1, 0)
                            );
                          }
                        }}
                      />
                      <Combobox.Button
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setLogStreamOpen((open) => !open)}
                      >
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </Combobox.Button>
                      <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-xl ring-1 ring-black ring-opacity-10 focus:outline-none sm:text-sm border border-gray-200">
                        <div
                          ref={parentRefLogStream}
                          style={{
                            maxHeight: "15rem",
                            overflow: "auto",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              height: `${logStreamVirtualizer.getTotalSize()}px`,
                              position: "relative",
                            }}
                          >
                            {logStreamVirtualizer
                              .getVirtualItems()
                              .map((virtualRow) => {
                                const stream =
                                  filteredLogStreams[virtualRow.index];
                                return (
                                  <div
                                    key={stream.logStreamName}
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      width: "100%",
                                      transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                  >
                                    <Combobox.Option
                                      value={stream.logStreamName}
                                      className={({ active }) =>
                                        `relative cursor-pointer select-none py-2 pl-4 pr-10 rounded-lg transition-all ${
                                          active
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-900"
                                        }`
                                      }
                                      onMouseEnter={() =>
                                        setLogStreamActiveIndex(
                                          virtualRow.index
                                        )
                                      }
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span
                                            className={`block truncate ${
                                              selected
                                                ? "font-semibold"
                                                : "font-normal"
                                            }`}
                                          >
                                            {stream.logStreamName}
                                          </span>
                                          {selected ? (
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                              ✓
                                            </span>
                                          ) : null}
                                        </>
                                      )}
                                    </Combobox.Option>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                        {filteredLogStreams.length === 0 &&
                          debouncedLogStreamQuery !== "" && (
                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                              No log streams found.
                            </div>
                          )}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                </div>
              </div>

              {/* Filter Pattern */}
              <div className="col-span-1">
                <div className="flex items-center mb-2 gap-1">
                  <label className="block text-base font-semibold text-gray-800">
                    Filter Pattern
                  </label>
                  <div
                    className="relative group"
                    tabIndex={0}
                    aria-label="Filter Pattern Example"
                    role="button"
                  >
                    <Info className="w-4 h-4 text-gray-400 cursor-pointer group-hover:text-blue-600 group-focus:text-blue-600" />
                    <div
                      className="absolute left-1/2 bottom-full mb-2 z-30 -translate-x-1/2 w-80 rounded-lg bg-gray-900 text-white text-xs px-4 py-2 shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus:pointer-events-auto transition-opacity duration-200"
                      role="tooltip"
                    >
                      <div className="font-semibold mb-1">Examples:</div>
                      <div className="font-mono">ERROR</div>
                      <div className="font-mono">ERROR Exception</div>
                      <div className="font-mono">&quot;Out of memory&quot;</div>
                      <div className="font-mono">{'{ $.level = "ERROR" }'}</div>
                      <div className="font-mono">
                        [timestamp, requestId, message]
                      </div>
                      <div className="font-mono">
                        {'{ $.userId = "123" && $.status = "FAIL" }'}
                      </div>
                      <div className="mt-1">
                        See AWS docs for advanced patterns.
                      </div>
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  value={filterPattern}
                  onChange={(e) => setFilterPattern(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm"
                  placeholder="e.g., ERROR, [timestamp, requestId]"
                />
              </div>

              {/* Start Time */}
              <div className="col-span-1">
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm"
                />
              </div>

              {/* End Time */}
              <div className="col-span-1">
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white shadow-sm"
                />
              </div>

              {/* Actions */}
              <div className="col-span-full flex flex-wrap gap-4 mt-2 items-center">
                <button
                  type="submit"
                  disabled={loading || !selectedLogGroup}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-base shadow-md transition-all"
                >
                  <Search className="w-5 h-5" />
                  Search Logs
                </button>
                {logEvents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => exportLogs(logEvents)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center gap-2 text-base shadow-md transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Export Results
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 flex items-center gap-2 text-base shadow-md transition-all"
                >
                  <X className="w-5 h-5" />
                  Clear Filters
                </button>
              </div>
            </form>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-red-700 text-base">{error}</p>
              </div>
            </div>
          )}

          {/* Results Section */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Log Events ({logEvents.length} results)
              </h2>
              {loading && (
                <div className="flex items-center text-gray-600">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </div>
              )}
            </div>

            {logEvents.length > 0 ? (
              <div className="space-y-3 max-h-164 overflow-y-auto">
                {logEvents.map((event, index) => (
                  <div
                    key={event.eventId || index}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-blue-600">
                        {event.logStreamName}
                      </span>
                      <span className="text-xs text-gray-700">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono bg-gray-100 p-2 rounded">
                      {event.message}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              !loading && (
                <div className="text-center py-8 text-gray-700">
                  <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    No log events found. Try adjusting your search criteria.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
