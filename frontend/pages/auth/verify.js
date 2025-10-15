import dynamic from "next/dynamic";

const VerifyEmail = dynamic(() => import("../../components/VerifyEmail.js"), {
  ssr: false,
});

export default function verifyEmailPage() {
  return <VerifyEmail />;
}
