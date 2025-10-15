import { useState, useRef, useEffect } from "react";
import {
  Form,
  InputNumber,
  Button,
  message,
  Typography,
  Divider,
  Layout,
} from "antd";
import SignaturePad from "react-signature-canvas";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

const { Title } = Typography;

export default function NouveauDevisAvance() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signatureDate, setSignatureDate] = useState(null);
  const [total, setTotal] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const signatureRef = useRef();
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleRetour = () => router.push("/societes/accueil");

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/company/has-active-subscription`,
          {
            method: "GET",
            headers: { token },
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.active) {
            message.warning("Vous avez déjà un abonnement en cours.");
            setHasActiveSubscription(true);
          }
        }
      } catch (err) {
        console.error("Erreur lors de la vérification d’abonnement :", err);
      }
    };

    if (token) checkSubscription();
  }, [token]);

  const onEmployeesChange = async (value) => {
    form.setFieldsValue({ employees: value });

    if (!value || value < 1) {
      setTotal(null);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/company/estimate-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify({ employees: value }),
        }
      );

      if (!res.ok) {
        setTotal(null);
        return;
      }

      const data = await res.json();
      setTotal(data.amount);
    } catch (err) {
      console.error("Erreur preview:", err);
      setTotal(null);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f9fbfd" }}>
      <motion.img
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        src="/back_icon.png"
        alt="go back"
        onClick={handleRetour}
        style={{
          height: "40px",
          width: "40px",
          position: "fixed",
          top: "20px",
          left: "20px",
          cursor: "pointer",
          zIndex: 999,
        }}
      />
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
          Nouveau Devis
        </motion.h1>

        <Form form={form} layout="vertical">
          <Form.Item
            name="employees"
            label="Nombre de salariés"
            rules={[{ required: true, message: "Entrez un nombre valide" }]}
          >
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              onChange={onEmployeesChange}
            />
          </Form.Item>

          {total && (
            <div style={{ marginBottom: 15 }}>
              <strong>Total TTC estimé : {total.toFixed(2)} €</strong>
            </div>
          )}

          <Divider />
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
          <Button
            onClick={() => {
              signatureRef.current.clear();
              setSigned(false);
              setSignatureDate(null);
            }}
            style={{ marginTop: 10, marginRight: 10 }}
          >
            Effacer la signature
          </Button>

          <Divider />
          <Button
            type="primary"
            loading={loading}
            onClick={async () => {
              let values;
              try {
                values = await form.validateFields();
              } catch (err) {
                return message.error("Veuillez entrer le nombre de salariés.");
              }

              if (!signed || !signatureDate) {
                return message.warning(
                  "Veuillez signer le devis avant de continuer."
                );
              }

              try {
                setLoading(true);

                const response = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/company/estimates`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      token,
                    },
                    body: JSON.stringify({
                      employees: values.employees,
                      signature_date: signatureDate.toISOString(),
                    }),
                  }
                );

                if (!response.ok) {
                  const text = await response.text();

                  if (
                    response.status === 403 &&
                    text.includes("abonnement actif")
                  ) {
                    message.warning("Vous avez déjà un abonnement en cours.");
                    return;
                  }

                  throw new Error(text);
                }

                message.success("Devis signé et enregistré avec succès.");
                router.push("/societes/accueil");
              } catch (err) {
                console.error(err);
                message.error("Erreur lors de la création du devis.");
              } finally {
                setLoading(false);
              }
            }}
          >
            Signer et Enregistrer
          </Button>
        </Form>
      </Layout.Content>
    </Layout>
  );
}
