import dynamic from "next/dynamic";

const Accueilsociete = dynamic(
  () => import("../../components/Accueilsociete"),
  { ssr: false }
);

export default function AccueilsocietePage() {
  return <Accueilsociete />;
}
