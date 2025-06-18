// app/components/AdvancedSearch.tsx
"use client";

import { useState } from "react";
import { Plus, Minus, Search, RotateCcw } from "lucide-react";

interface SearchCriteria {
  id: string;
  field: "message" | "timestamp" | "logLevel" | "custom";
  operator: "contains" | "equals" | "startsWith" | "regex" | "between";
  value: string;
  value2?: string; // For 'between' operator
}

interface AdvancedSearchProps {
  onSearch: (criteria: SearchCriteria[], filterPattern: string) => void;
  loading: boolean;
}

export default function AdvancedSearch({
  onSearch,
  loading,
}: AdvancedSearchProps) {
  const [criteria, setCriteria] = useState<SearchCriteria[]>([
    {
      id: "1",
      field: "message",
      operator: "contains",
      value: "",
    },
  ]);

  const [logLevel, setLogLevel] = useState("");
  const [combineOperator, setCombineOperator] = useState<"AND" | "OR">("AND");

  const addCriteria = () => {
    const newCriteria: SearchCriteria = {
      id: Date.now().toString(),
      field: "message",
      operator: "contains",
      value: "",
    };
    setCriteria([...criteria, newCriteria]);
  };

  const removeCriteria = (id: string) => {
    if (criteria.length > 1) {
      setCriteria(criteria.filter((c) => c.id !== id));
    }
  };

  const updateCriteria = (id: string, updates: Partial<SearchCriteria>) => {
    setCriteria(criteria.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const resetCriteria = () => {
    setCriteria([
      {
        id: "1",
        field: "message",
        operator: "contains",
        value: "",
      },
    ]);
    setLogLevel("");
  };

  const buildFilterPattern = () => {
    const patterns: string[] = [];

    // Add log level filter if specified
    if (logLevel) {
      patterns.push(logLevel);
    }

    // Build patterns from criteria
    criteria.forEach((criterion) => {
      if (!criterion.value.trim()) return;

      switch (criterion.field) {
        case "message":
          switch (criterion.operator) {
            case "contains":
              patterns.push(`"${criterion.value}"`);
              break;
            case "equals":
              patterns.push(`"${criterion.value}"`);
              break;
            case "startsWith":
              patterns.push(`"${criterion.value}"`);
              break;
            case "regex":
              patterns.push(criterion.value);
              break;
          }
          break;
        case "custom":
          patterns.push(criterion.value);
          break;
      }
    });

    // Combine patterns
    if (patterns.length === 0) return "";
    if (patterns.length === 1) return patterns[0];

    return combineOperator === "AND"
      ? patterns.join(" ")
      : `(${patterns.join(" OR ")})`;
  };

  const handleSearch = () => {
    const filterPattern = buildFilterPattern();
    onSearch(criteria, filterPattern);
  };

  const commonLogLevels = [
    { value: "ERROR", label: "Error" },
    { value: "WARN", label: "Warning" },
    { value: "INFO", label: "Info" },
    { value: "DEBUG", label: "Debug" },
    { value: "TRACE", label: "Trace" },
    { value: "FATAL", label: "Fatal" },
  ];

  const quickSearchTemplates = [
    { label: "Errors Only", pattern: "ERROR" },
    { label: "Warnings & Errors", pattern: "ERROR OR WARN" },
    { label: "HTTP 5xx Errors", pattern: '"5[0-9][0-9]"' },
    {
      label: "Database Queries",
      pattern: "SELECT OR INSERT OR UPDATE OR DELETE",
    },
    {
      label: "Authentication Events",
      pattern: "login OR authentication OR auth",
    },
  ];

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Search</h3>
        <button
          onClick={resetCriteria}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Quick Search Templates */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Search Templates
        </label>
        <div className="flex flex-wrap gap-2">
          {quickSearchTemplates.map((template) => (
            <button
              key={template.label}
              onClick={() => onSearch([], template.pattern)}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log Level Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Log Level
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setLogLevel("")}
            className={`px-3 py-1 text-sm rounded-md border ${
              logLevel === ""
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            All Levels
          </button>
          {commonLogLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => setLogLevel(level.value)}
              className={`px-3 py-1 text-sm rounded-md border ${
                logLevel === level.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Criteria */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Search Criteria
          </label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Combine with:</span>
              <select
                value={combineOperator}
                onChange={(e) =>
                  setCombineOperator(e.target.value as "AND" | "OR")
                }
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            </div>
            <button
              onClick={addCriteria}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Criteria
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {criteria.map((criterion, index) => (
            <div
              key={criterion.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              {index > 0 && (
                <span className="text-xs text-gray-500 font-medium">
                  {combineOperator}
                </span>
              )}

              <select
                value={criterion.field}
                onChange={(e) =>
                  updateCriteria(criterion.id, {
                    field: e.target.value as "message" | "custom",
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="message">Message</option>
                <option value="custom">Custom Pattern</option>
              </select>

              <select
                value={criterion.operator}
                onChange={(e) =>
                  updateCriteria(criterion.id, {
                    operator: e.target.value as
                      | "contains"
                      | "equals"
                      | "startsWith"
                      | "regex",
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="contains">Contains</option>
                <option value="equals">Equals</option>
                <option value="startsWith">Starts With</option>
                <option value="regex">Regex</option>
              </select>

              <input
                type="text"
                value={criterion.value}
                onChange={(e) =>
                  updateCriteria(criterion.id, { value: e.target.value })
                }
                placeholder="Enter search value..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />

              {criteria.length > 1 && (
                <button
                  onClick={() => removeCriteria(criterion.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Search Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Filter Pattern:{" "}
          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
            {buildFilterPattern() || "No pattern"}
          </code>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Search Logs
        </button>
      </div>
    </div>
  );
}
