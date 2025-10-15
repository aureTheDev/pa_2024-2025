import dynamic from "next/dynamic";

const SalarieDetails = dynamic(
  () => import("../../../components/SalarieDetails"),
  {
    ssr: false,
  }
);

export async function getServerSideProps(context) {
  const { id } = context.params;
  const token = context.req.cookies.access_token || "";

  console.log(" [getServerSideProps] ID reçu :", id);
  console.log(
    " [getServerSideProps] Token reçu (début) :",
    token.slice(0, 20) + "..."
  );

  if (!token) {
    console.warn(" Aucun token reçu dans les cookies.");
    return { notFound: true };
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/company/collaborators/${id}`;

  try {
    const res = await fetch(url, {
      headers: {
        token: token,
      },
    });

    const raw = await res.clone().text();
    console.log(" Réponse brute API :", raw);
    console.log(" Statut HTTP :", res.status);

    if (!res.ok) {
      console.error(" Réponse API NON OK");
      return { notFound: true };
    }

    const salarie = await res.json();
    console.log(" Données salarie :", salarie);

    return {
      props: { salarie },
    };
  } catch (error) {
    console.error(" Erreur dans getServerSideProps :", error);
    return { notFound: true };
  }
}

export default SalarieDetails;
