import dynamic from "next/dynamic";

const InscriptionFormulaire = dynamic(
  () => import("../../components/inscriptionsociete"),
  { ssr: false }
);

export default function SocietePage() {
  return <InscriptionFormulaire />;
}
