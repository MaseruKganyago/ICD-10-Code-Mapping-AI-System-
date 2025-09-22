"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Progress,
  Space,
  Typography,
  Alert,
  Divider,
  Row,
  Col,
  Statistic,
  Tag,
  Spin,
} from "antd";
import {
  PlayCircleOutlined,
  ReloadOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import type {
  InitializationStatus,
  InitializationStartResponse,
} from "@/types/api";

const { Title, Text, Paragraph } = Typography;

interface LogEntry {
  timestamp: Date;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

const InitializationMonitor: React.FC = () => {
  const [status, setStatus] = useState<InitializationStatus>({
    status: "not_started",
    progress: 0,
    message: "System not initialized",
    started_at: null,
    completed_at: null,
  });
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: new Date(),
      message: 'Ready - Click "Start Initialization" to begin',
      type: "info",
    },
  ]);
  const [isPolling, setIsPolling] = useState(false);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [...prev, { timestamp: new Date(), message, type }]);
  };

  const formatDuration = (startTime: number, endTime?: number): string => {
    const end = endTime || Date.now();
    const duration = Math.round(((end - startTime) / 60000) * 10) / 10;
    return `${duration} minutes`;
  };

  const getStatusColor = (status: InitializationStatus["status"]): string => {
    switch (status) {
      case "completed":
        return "success";
      case "failed":
        return "error";
      case "in_progress":
        return "processing";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: InitializationStatus["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "failed":
        return <ExclamationCircleOutlined style={{ color: "#f5222d" }} />;
      case "in_progress":
        return <Spin size="small" />;
      default:
        return <ClockCircleOutlined style={{ color: "#d9d9d9" }} />;
    }
  };

  const checkStatus = useCallback(async () => {
    try {
      const response = await axios.get<InitializationStatus>(
        "/api/initialize/status"
      );
      const newStatus = response.data;

      // Only log significant changes
      if (
        newStatus.status !== status.status ||
        Math.abs(newStatus.progress - status.progress) >= 5
      ) {
        addLog(
          `Status: ${newStatus.status} (${newStatus.progress}%) - ${newStatus.message}`,
          newStatus.status === "completed"
            ? "success"
            : newStatus.status === "failed"
            ? "error"
            : "info"
        );
      }

      setStatus(newStatus);

      // Stop polling when completed or failed
      if (
        (newStatus.status === "completed" || newStatus.status === "failed") &&
        isPolling
      ) {
        setIsPolling(false);
        if (newStatus.status === "completed") {
          addLog(
            `✅ Initialization completed successfully! (${
              newStatus.duration_minutes || "?"
            } minutes)`,
            "success"
          );
        } else if (newStatus.status === "failed") {
          addLog(
            `❌ Initialization failed: ${newStatus.error || "Unknown error"}`,
            "error"
          );
        }
      }
    } catch (error) {
      addLog(`❌ Failed to check status: ${error}`, "error");
    }
  }, [status.status, status.progress, isPolling]);

  const startInitialization = async () => {
    try {
      setLoading(true);
      addLog("🚀 Starting initialization...", "info");

      const response = await axios.post<InitializationStartResponse>(
        "/api/initialize"
      );
      const data = response.data;

      if (data.status === "in_progress") {
        addLog("✅ Initialization started in background", "success");
        setIsPolling(true);
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.error || error.message || "Unknown error";
      addLog(`❌ Failed to start initialization: ${errorMsg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const togglePolling = () => {
    setIsPolling((prev) => {
      const newPolling = !prev;
      addLog(
        newPolling
          ? "▶️ Started auto-polling (every 2 seconds)"
          : "⏹️ Stopped auto-polling",
        "info"
      );
      return newPolling;
    });
  };

  // Polling effect
  useEffect(() => {
    if (isPolling) {
      const interval = setInterval(checkStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [isPolling, checkStatus]);

  // Initial status check
  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={1} style={{ textAlign: "center", marginBottom: "32px" }}>
        🏥 ICD-10 API Initialization Monitor
      </Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card className="status-card">
            <Space direction="vertical" style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Title level={4} style={{ margin: 0 }}>
                  System Status
                </Title>
                <Tag
                  color={getStatusColor(status.status)}
                  icon={getStatusIcon(status.status)}
                >
                  {status.status.replace("_", " ").toUpperCase()}
                </Tag>
              </div>

              <div className="progress-section">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <Text strong>Progress</Text>
                  <Text>{status.progress}%</Text>
                </div>
                <Progress
                  percent={status.progress}
                  status={
                    status.status === "failed"
                      ? "exception"
                      : status.status === "completed"
                      ? "success"
                      : "active"
                  }
                  strokeColor={
                    status.status === "completed" ? "#52c41a" : "#1890ff"
                  }
                />
              </div>

              <Alert
                message="Current Step"
                description={status.message}
                type={
                  status.status === "completed"
                    ? "success"
                    : status.status === "failed"
                    ? "error"
                    : "info"
                }
                showIcon
              />

              <Space wrap>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={startInitialization}
                  loading={loading}
                  disabled={
                    status.status === "in_progress" ||
                    status.status === "completed"
                  }
                >
                  Start Initialization
                </Button>
                <Button icon={<ReloadOutlined />} onClick={checkStatus}>
                  Check Status
                </Button>
                <Button
                  icon={
                    isPolling ? <PauseCircleOutlined /> : <PlayCircleOutlined />
                  }
                  onClick={togglePolling}
                  type={isPolling ? "default" : "dashed"}
                >
                  {isPolling ? "Stop" : "Start"} Auto-Polling
                </Button>
              </Space>

              {status.error && (
                <Alert
                  message="Error Details"
                  description={status.error}
                  type="error"
                  showIcon
                />
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Statistics">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Started At"
                  value={
                    status.started_at
                      ? new Date(status.started_at).toLocaleTimeString()
                      : "-"
                  }
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Duration"
                  value={
                    status.started_at
                      ? formatDuration(
                          status.started_at,
                          status.completed_at || undefined
                        )
                      : "-"
                  }
                />
              </Col>
            </Row>
            <Divider />
            <Paragraph>
              <Text type="secondary">
                <strong>Estimated Time:</strong> 10-30 minutes (first run)
                <br />
                <small>Initial setup downloads ML models (~400MB). Subsequent runs are much faster.</small>
              </Text>
            </Paragraph>
          </Card>

          <Card title="Process Logs" style={{ marginTop: "16px" }}>
            <div className="logs-container">
              {logs.map((log, index) => (
                <div key={index} className="log-entry">
                  <span className="log-timestamp">
                    [{log.timestamp.toLocaleTimeString()}]
                  </span>
                  <span
                    style={{
                      color:
                        log.type === "success"
                          ? "#52c41a"
                          : log.type === "error"
                          ? "#f5222d"
                          : log.type === "warning"
                          ? "#faad14"
                          : "#666",
                    }}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InitializationMonitor;
