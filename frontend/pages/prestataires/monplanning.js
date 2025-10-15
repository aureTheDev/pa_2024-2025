import dynamic from "next/dynamic";

const PlanningPrestataire = dynamic(
  () => import("../../components/MonPlanning"),
  { ssr: false }
);

export default function PlanningPrestatairePage() {
  return <PlanningPrestataire />;
}
