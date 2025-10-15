import dynamic from "next/dynamic";

const DynamicContactForm = dynamic(
  () => import("../../components/contactForm"),
  { ssr: false }
);

export default function ContactFormPage() {
  return <DynamicContactForm />;
}
