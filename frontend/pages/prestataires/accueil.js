import dynamic from "next/dynamic";

const Accueilprestataire = dynamic(
  () => import("../../components/Accueilprestataire"),
  { ssr: false }
);

export default function AccueilsocietePage() {
  return <Accueilprestataire />;
}
