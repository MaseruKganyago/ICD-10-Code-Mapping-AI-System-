import dynamic from "next/dynamic";
import { Spin } from "antd";
import { Fragment } from "react";
import { Navigation } from "@/components";

const DiagnosisMapper = dynamic(() => import("@/components/DiagnosisMapper"), {
  loading: () => (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <Spin size="large" />
    </div>
  ),
  ssr: false,
});

export default function MapperPage() {
  return (
    <Fragment>
      <Navigation />
      <DiagnosisMapper />
    </Fragment>
  );
}
