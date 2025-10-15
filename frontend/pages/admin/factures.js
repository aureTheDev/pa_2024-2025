import dynamic from "next/dynamic";

const AllBills = dynamic(() => import("../../components/Adminbills"), {
  ssr: false,
});

export default function AllBillsPage() {
  return <AllBills />;
}
