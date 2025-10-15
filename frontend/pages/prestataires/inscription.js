import dynamic from "next/dynamic";

const InscriptionPrestataire = dynamic(
  () => import("../../components/inscriptionprestataire"),
  { ssr: false }
);

export default function PrestatairesPage() {
  return <InscriptionPrestataire />;
}
