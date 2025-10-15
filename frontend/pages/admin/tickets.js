import dynamic from "next/dynamic";

const AllTickets = dynamic(() => import("../../components/Admintickets"), {
  ssr: false,
});

export default function AllTicketsPage() {
  return <AllTickets />;
}
