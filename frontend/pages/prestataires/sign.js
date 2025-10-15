import dynamic from "next/dynamic";

const SignContract = dynamic(
  () => import("../../components/ContractorSignContract"),
  { ssr: false }
);

export default function SignContractPage() {
  return <SignContract />;
}
