"use client";

import dynamic from "next/dynamic";

const SuccessPage = dynamic(() => import("../../components/SuccessPage"), {
  ssr: false,
  loading: () => <p>Chargement...</p>,
});

export default function SuccessWrapper() {
  return <SuccessPage />;
}
