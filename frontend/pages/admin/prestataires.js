import dynamic from "next/dynamic";

const AdminContractors = dynamic(
  () => import("../../components/Admincontractors"),
  { ssr: false }
);

export default function PrestatairesPage() {
  return <AdminContractors />;
}
