import dynamic from "next/dynamic";

const SubjectDiscussion = dynamic(
  () => import("../../../components/SubjectDiscussion"),
  { ssr: false }
);

export default function SubjectPage() {
  return <SubjectDiscussion />;
}
