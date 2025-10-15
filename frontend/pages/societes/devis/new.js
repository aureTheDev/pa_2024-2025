import dynamic from "next/dynamic";
import React from "react";

const NouveauDevis = dynamic(() => import("../../../components/NewDevis"), {
  ssr: false,
});

export default function NouvellePageDevis() {
  return <NouveauDevis />;
}
