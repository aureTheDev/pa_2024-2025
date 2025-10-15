import dynamic from "next/dynamic";

const Accueilsalarie = dynamic(
  () => import("../../components/Accueilsalarie"),
  { ssr: false }
);

export default function AccueilsalariePage() {
  return <Accueilsalarie />;
}
