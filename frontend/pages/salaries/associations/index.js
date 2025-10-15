import dynamic from "next/dynamic";

const AssociationBoard = dynamic(
  () => import("../../../components/AssociationBoard"),
  { ssr: false }
);

export default function AssociationPage() {
  return <AssociationBoard />;
}
