import dynamic from "next/dynamic";

const CategoryList = dynamic(() => import("../../components/CategoryList"), {
  ssr: false,
});

export default function ForumPage({ categories }) {
  return <CategoryList {...{ categories }} />;
}

export async function getServerSideProps(context) {
  const token = context.req.cookies.access_token;

  if (!token) {
    return {
      props: {
        categories: [],
      },
    };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/forum/categories`, {
      method: "GET",
      headers: {
        token,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error("Erreur lors du chargement des catégories");
    }

    return {
      props: {
        categories: data,
      },
    };
  } catch (err) {
    console.error("Erreur de récupération des catégories :", err.message);
    return {
      props: {
        categories: [],
      },
    };
  }
}
