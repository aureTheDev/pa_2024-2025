// pages/societes/salaries/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const SalariesPage = dynamic(() => import("../../../components/SalariesPage"), {
  ssr: false,
});

export default function SalariesIndex() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/auth/login");
      return;
    }

    const fetchSalaries = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/collaborators`,
          {
            headers: {
              "Content-Type": "application/json",
              token,
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Erreur API ${res.status}`);
        }

        const data = await res.json();
        setSalaries(data);
      } catch (err) {
        console.error("Erreur lors de la récupération des salariés :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalaries();
  }, [router]);

  return <SalariesPage salaries={salaries} />;
}
