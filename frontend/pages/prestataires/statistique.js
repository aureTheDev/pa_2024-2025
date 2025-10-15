import dynamic from "next/dynamic";

const StatistiquePrestataire = dynamic(
  () => import("../../components/StatistiquePrestataire"),
  { ssr: false }
);

export default function StatistiquePrestatairePage() {
  return <StatistiquePrestataire />;
}
