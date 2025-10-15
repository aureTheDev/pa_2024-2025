"use client";

import { Button } from "antd";
import { useRouter } from "next/router";

export default function CancelPage() {
  const router = useRouter();

  const handleRetourFactures = () => {
    router.push("/societes/factures");
  };

  return (
    <div style={{ textAlign: "center", padding: "100px" }}>
      <h1 style={{ color: "#d32029", fontSize: "2rem" }}>❌ Paiement Annulé</h1>
      <p>Le paiement a été annulé. Vous pouvez réessayer à tout moment.</p>
      <Button
        type="primary"
        onClick={handleRetourFactures}
        style={{
          marginTop: "20px",
          backgroundColor: "#007b7f",
          borderColor: "#007b7f",
          fontWeight: "bold",
        }}
      >
        Retourner aux factures
      </Button>
    </div>
  );
}
