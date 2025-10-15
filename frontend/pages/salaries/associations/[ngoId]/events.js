import dynamic from "next/dynamic";

const EventsByNgo = dynamic(
  () => import("../../../../components/EventsByNgo"),
  { ssr: false }
);

export default function EventsByNgoPage() {
  return <EventsByNgo />;
}