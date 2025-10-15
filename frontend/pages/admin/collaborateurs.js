import dynamic from "next/dynamic";

const Allcollaborators = dynamic(
  () => import("../../components/Admincollaborators"),
  {
    ssr: false,
  }
);

export default function AllCollaboratorsPage() {
  return <Allcollaborators />;
}
