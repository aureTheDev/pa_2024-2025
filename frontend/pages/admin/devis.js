import dynamic from "next/dynamic";

const AllEstimates = dynamic(() => import("../../components/Adminestimates"), {
  ssr: false,
});

export default function AllEstimatesPage() {
  return <AllEstimates />;
}
