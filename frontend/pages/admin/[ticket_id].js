import dynamic from "next/dynamic";

const AllTicketsDetails = dynamic(
  () => import("../../components/Adminticketdetails"),
  {
    ssr: false,
  }
);

export default function AllTicketsDetailsPage() {
  return <AllTicketsDetails />;
}
