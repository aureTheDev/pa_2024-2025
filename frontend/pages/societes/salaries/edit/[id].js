import dynamic from "next/dynamic";

const EditSalarie = dynamic(
  () => import("../../../../components/EditSalarie"),
  { ssr: false }
);

export async function getServerSideProps(context) {
  const { id } = context.params;
  const token = context.req.cookies.access_token || "";

  if (!id || id === "default" || !token) {
    return { notFound: true };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/collaborators/${id}`, {
      headers: { token },
    });

    if (!res.ok) {
      console.error("❌ Erreur API - statut :", res.status);
      return { notFound: true };
    }

    const salarie = await res.json();

    return {
      props: {
        salarie,
        token,
      },
    };
  } catch (err) {
    console.error("🔥 Erreur côté serveur :", err);
    return { notFound: true };
  }
}

export default function EditPage({ salarie, token }) {
  return <EditSalarie salarie={salarie} token={token} />;
}
