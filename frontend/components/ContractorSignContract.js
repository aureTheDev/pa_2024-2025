import { useState, useRef } from "react";
import { Layout, Button, message, Typography, Divider } from "antd";
import SignaturePad from "react-signature-canvas";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

const { Title } = Typography;

export default function SignContract() {
  const [loading, setLoading] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signatureDate, setSignatureDate] = useState(null);
  const signatureRef = useRef();
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleClearSignature = () => {
    signatureRef.current.clear();
    setSigned(false);
    setSignatureDate(null);
  };

  const handleSubmitSignature = async () => {
    if (!signed || !signatureDate) {
      return message.warning("Veuillez signer avant de continuer.");
    }

    const signatureData = signatureRef.current.toDataURL("image/png");
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contractor/sign_contract`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify({
            signature: signatureData,
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }

      message.success("Signature enregistrée avec succès.");
      router.push("/prestataires/accueil");
    } catch (err) {
      console.error(err);
      message.error("Erreur lors de l'enregistrement de la signature.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f9fbfd" }}>
      <Layout.Content
        style={{
          padding: "40px 50px",
          marginTop: "70px",
          width: "70%",
          margin: "0 auto",
        }}
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            textAlign: "center",
            fontSize: "2rem",
            marginBottom: "30px",
            color: "#007b7f",
          }}
        >
          Signature du devis
        </motion.h1>

        <Title level={5}>Signature :</Title>
        <SignaturePad
          ref={signatureRef}
          canvasProps={{
            width: 500,
            height: 150,
            className: "signatureCanvas",
            style: { border: "1px solid #d9d9d9", borderRadius: 8 },
          }}
          onEnd={() => {
            setSigned(true);
            setSignatureDate(new Date());
          }}
        />
        <div style={{ marginTop: 10 }}>
          <Button onClick={handleClearSignature} style={{ marginRight: 10 }}>
            Effacer la signature
          </Button>
          <Button type="primary" loading={loading} onClick={handleSubmitSignature}>
            Signer et Enregistrer
          </Button>
        </div>

        <Divider />
      </Layout.Content>
    </Layout>
  );
}