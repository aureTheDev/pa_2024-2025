import dynamic from "next/dynamic";

const Allngo = dynamic(() => import("../../components/Adminassociations"), {
  ssr: false,
});

export default function AllngoPage() {
  return <Allngo />;
}
