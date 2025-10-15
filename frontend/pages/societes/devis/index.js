import React from "react";
import dynamic from "next/dynamic";
const DevisListe = dynamic(() => import("../../../components/DevisListe"), {
  ssr: false,
});
export default function DevisPage() {
  return <DevisListe />;
}
