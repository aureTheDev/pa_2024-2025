import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const FacturesPage = dynamic(() => import("../../../components/FacturesPage"), {
  ssr: false,
});

export default function FacturesIndex() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Ne pas exécuter si pas dans un navigateur
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/auth/login");
      return;
    }

    const fetchFactures = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/bills`, {
          headers: {
            "Content-Type": "application/json",
            token,
          },
        });

        if (!res.ok) {
          throw new Error(`Erreur API ${res.status}`);
        }

        const data = await res.json();
        setFactures(data);
      } catch (err) {
        console.error("Erreur lors de la récupération des factures :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFactures();
  }, [router]);

  return <FacturesPage factures={factures} />;
}
