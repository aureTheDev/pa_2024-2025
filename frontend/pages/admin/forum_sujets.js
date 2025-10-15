import dynamic from "next/dynamic";

const Allsubjects = dynamic(
  () => import("../../components/Adminforumsubjects"),
  {
    ssr: false,
  }
);

export default function AllCategoriesPage() {
  return <Allsubjects />;
}
