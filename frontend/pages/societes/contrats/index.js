import dynamic from "next/dynamic";

// Importation dynamique du composant (sans SSR)
const ContratsPage = dynamic(() => import("../../../components/ContratsPage"), {
  ssr: false,
});

export default ContratsPage;
