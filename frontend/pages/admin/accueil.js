import dynamic from "next/dynamic";

const Dashboard = dynamic(() => import("../../components/Accueiladmin"), {
  ssr: false,
});

export default function DashboardPage() {
  return <Dashboard />;
}
