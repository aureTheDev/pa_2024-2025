import dynamic from "next/dynamic";

const HistoriquePrestataire = dynamic(
  () => import("../../components/HistoriquePrestations"),
  { ssr: false }
);

export default function HistoriquePrestatairePage() {
  return <HistoriquePrestataire />;
}
