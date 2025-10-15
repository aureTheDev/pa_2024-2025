"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function SuccessPage() {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(true);

  useEffect(() => {
    const updateBillAfterPayment = async () => {
      const subscriptionId = localStorage.getItem(
        "pending_payment_subscription_id"
      );
      const token = localStorage.getItem("token");

      if (!subscriptionId || !token) {
        console.error("Informations manquantes pour mettre à jour la facture.");
        setIsUpdating(false);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/company/bills/${subscriptionId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              token,
            },
            body: JSON.stringify({ payed: true }),
          }
        );

        if (!res.ok) {
          throw new Error("Erreur lors de la mise à jour de la facture.");
        }

        console.log("Facture mise à jour avec succès !");
        localStorage.removeItem("pending_payment_subscription_id");
      } catch (err) {
        console.error("Erreur update facture :", err);
      } finally {
        setIsUpdating(false);
      }
    };

    updateBillAfterPayment();
  }, [router]);

  return (
    <div style={{ textAlign: "center", padding: "100px" }}>
      <h1 style={{ color: "#28a745", fontSize: "2rem" }}>
        ✅ Paiement Réussi !
      </h1>
      <p>Merci pour votre achat.</p>

      {!isUpdating && (
        <button
          style={{
            marginTop: "20px",
            backgroundColor: "#007b7f",
            color: "white",
            border: "none",
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
          onClick={() => router.push("/societes/factures")}
        >
          Retourner aux factures
        </button>
      )}
    </div>
  );
}
