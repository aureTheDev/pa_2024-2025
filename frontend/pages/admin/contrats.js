import dynamic from "next/dynamic";

const AllContracts = dynamic(() => import("../../components/Admincontracts"), {
  ssr: false,
});

export default function AllContractsPage() {
  return <AllContracts />;
}
