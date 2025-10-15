import dynamic from "next/dynamic";

const AllCompany = dynamic(() => import("../../components/admincompanies"), {
  ssr: false,
});

export default function AllCompaniesPage() {
  return <AllCompany />;
}
