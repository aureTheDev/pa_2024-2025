import dynamic from "next/dynamic";
import { useRouter } from "next/router";

const SubjectsByCategory = dynamic(
  () => import("../../../components/SubjectList"),
  {
    ssr: false,
  }
);

export default function CategorySubjectsPage({ subjects }) {
  const router = useRouter();
  const { categoryId } = router.query;

  return <SubjectsByCategory subjects={subjects} categoryId={categoryId} />;
}

export async function getServerSideProps(context) {
  const token = context.req.cookies.access_token;
  const { categoryId } = context.params;

  if (!token || !categoryId) {
    return { props: { subjects: [] } };
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/forum/categories/${categoryId}/subjects`,
      {
        method: "GET",
        headers: { token },
      }
    );

    const data = await res.json();

    return {
      props: {
        subjects: data,
      },
    };
  } catch (err) {
    console.error("Erreur lors de la récupération des sujets :", err.message);
    return { props: { subjects: [] } };
  }
}
