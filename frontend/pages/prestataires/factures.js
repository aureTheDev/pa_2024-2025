import dynamic from "next/dynamic";

const FacturesPrestataire = dynamic(
  () => import("../../components/FacturesPrestataires"),
  { ssr: false }
);

export default function FacturesPrestatairePage() {
  return <FacturesPrestataire />;
}
