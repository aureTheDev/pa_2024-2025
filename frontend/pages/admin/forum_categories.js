import dynamic from "next/dynamic";

const Allcategories = dynamic(
  () => import("../../components/Admincategories"),
  {
    ssr: false,
  }
);

export default function AllCategoriesPage() {
  return <Allcategories />;
}
