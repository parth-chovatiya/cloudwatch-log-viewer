// app/components/EnhancedCloudWatchViewer.tsx
"use client";

// UNUSED COMPONENT - COMMENTED OUT TO FIX ERRORS
/*
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  AlertCircle,
  BarChart3,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import AdvancedSearch from "./AdvancedSearch";
import LogVisualization from "./LogVisualization";

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

interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

interface SearchCriteria {
  id: string;
  field: "message" | "timestamp" | "logLevel" | "custom";
  operator: "contains" | "equals" | "startsWith" | "regex" | "between";
  value: string;
  value2?: string;
}

export default function EnhancedCloudWatchViewer() {
  const [credentials, setCredentials] = useState<AWSCredentials>({
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-1",
  });

  const [logGroups, setLogGroups] = useState<LogGroup[]>([]);
  const [logStreams, setLogStreams] = useState<LogStream[]>([]);
  const [selectedLogGroup, setSelectedLogGroup] = useState("");
  const [selectedLogStream, setSelectedLogStream] = useState("");
  const [filterPattern, setFilterPattern] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [logEvents, setLogEvents] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentialsSet, setCredentialsSet] = useState(false);

  // UI State
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [showCredentials, setShowCredentials] = useState(true);
  const [searchMode, setSearchMode] = useState<"simple" | "advanced">("simple");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);

  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoRefresh && selectedLogGroup && credentialsSet) {
      interval = setInterval(() => {
        searchLogs();
      }, refreshInterval * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, selectedLogGroup, credentialsSet]);

  // Set default time range (last 1 hour)
  useEffect(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    setEndTime(now.toISOString().slice(0, 16));
    setStartTime(oneHourAgo.toISOString().slice(0, 16));
  }, []);

  const fetchLogGroups = async () => {
    if (!credentials.accessKeyId || !credentials.secretAccessKey) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: credentials.region,
      });

      const response = await fetch(`/api/cloudwatch?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch log groups");
      }

      setLogGroups(data.logGroups);
      setCredentialsSet(true);
      setShowCredentials(false); // Hide credentials after successful connection
    } catch (err) {
      setError((err as Error).message);
      setCredentialsSet(false);
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...credentials,
          logGroupName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch log streams");
      }

      setLogStreams(data.logStreams);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
}
*/
