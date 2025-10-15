"use client";

import dynamic from "next/dynamic";

const CancelPage = dynamic(() => import("../../components/CancelPage"), {
  ssr: false,
  loading: () => (
    <p style={{ textAlign: "center", marginTop: "100px", fontSize: "18px" }}>
      Chargement en cours...
    </p>
  ),
});

export default function CancelWrapper() {
  return <CancelPage />;
}
