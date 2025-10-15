import dynamic from "next/dynamic";

const RDVMedical = dynamic(
  () => import("../../components/RDVMedical"),
  { ssr: false }
);

export default function RDVMedicalPage(){
    return <RDVMedical />;
};