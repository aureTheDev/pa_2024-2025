import dynamic from "next/dynamic";

const ProfileSociete = dynamic(() => import("../../components/ProfilSociete"), {
  ssr: false,
});

export default function ProfilPage() {
  return <ProfileSociete />;
}
