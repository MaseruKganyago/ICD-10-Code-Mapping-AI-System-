import dynamic from "next/dynamic";
import { Spin } from "antd";
import { Fragment } from "react";
import { Navigation } from "@/components";

// Dynamically import the component to avoid SSR issues with browser APIs
const InitializationMonitor = dynamic(
  () => import("@/components/InitializationMonitor"),
  {
    loading: () => (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    ),
    ssr: false,
  }
);

export default function Home() {
  return (
    <Fragment>
      <Navigation />
      <InitializationMonitor />
    </Fragment>
  );
}
