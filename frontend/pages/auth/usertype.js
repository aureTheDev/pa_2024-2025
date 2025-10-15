import dynamic from "next/dynamic";

const Usertype = dynamic(() => import("../../components/Usertype"), {
  ssr: false,
});

export default function UserTypePage() {
  return <Usertype />;
}
