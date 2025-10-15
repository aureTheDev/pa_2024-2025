import dynamic from "next/dynamic";

const AllServices = dynamic(() => import("../../components/Adminservices"), {
  ssr: false,
});

export default function AllServicesPage() {
  return <AllServices />;
}
