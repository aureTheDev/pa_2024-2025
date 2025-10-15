import dynamic from "next/dynamic";

const NewSalarie = dynamic(() => import("../../../../components/NewSalarie"), {
  ssr: false,
});

export default function NewSalariePage() {
  return <NewSalarie />;
}
