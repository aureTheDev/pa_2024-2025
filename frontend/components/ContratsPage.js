import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import { Layout, Button, Modal, Form, Input, message } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import SignaturePad from "react-signature-canvas";

const Table = dynamic(() => import("antd/es/table"), { ssr: false });

const ContratsPage = () => {
  const router = useRouter();
  const signatureRef = useRef();
  const [contratsData, setContratsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [signModalVisible, setSignModalVisible] = useState(false);
  const [currentContract, setCurrentContract] = useState(null);
  const [signForm] = Form.useForm();

  useEffect(() => {
    fetchContrats();
  }, []);

  const fetchContrats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/company/contracts`,
        {
          headers: {
            token,
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) {
        console.error("Échec de la récupération des contrats");
        message.error("Impossible de charger les contrats");
        return;
      }

      const data = await res.json();

      const contrats = data.map((c) => ({
        ...c,
        reference: c.company_subscription_id,
        date_creation: c.creation_date,
        statut: c.signature_date ? "Signé" : "En attente",
        status: c.status,
      }));

      setContratsData(contrats);
    } catch (err) {
      console.error("Erreur récupération contrats :", err);
      message.error("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleRetour = () => router.push("/societes/accueil");

  const handleSign = async () => {
    try {
      const token = localStorage.getItem("token");
      const now = new Date();
      const values = await signForm.validateFields();

      if (!signatureRef.current || signatureRef.current.isEmpty()) {
        return message.error("Veuillez signer le contrat.");
      }
      console.log("Token:", token);

      const signatureImage = signatureRef.current
        .getCanvas()
        .toDataURL("image/png");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/company/sign-contract`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({
            company_id: currentContract.company_id,
            subscription_id: currentContract.company_subscription_id,
            signature: signatureImage,
          }),
        }
      );

      if (!res.ok) throw new Error("Erreur côté serveur");

      message.success("Contrat signé par votre société !");
      setSignModalVisible(false);

      await fetchContrats();
    } catch (error) {
      console.error("Erreur lors de la signature:", error);
      message.error("Échec de la signature du contrat.");
    }
  };

  const getStatusText = (record) => {
    if (record.company_signed && record.admin_signed)
      return "Complètement signé";
    if (record.company_signed) return "Signé par la société";
    return "En attente";
  };

  const columns = [
    {
      title: "Référence",
      dataIndex: "company_subscription_id",
    },
    {
      title: "Fichier",
      dataIndex: "file",
      render: (file) => file?.split("/").pop() || "-",
    },
    {
      title: "Date",
      dataIndex: "creation_date",
      render: (date) => new Date(date).toLocaleDateString("fr-FR"),
    },
    {
      title: "Statut de  signature",
      render: (_, record) => <span>{getStatusText(record)}</span>,
    },
    {
      title: "Vue",
      render: (_, record) => (
        <Button
          icon={<EyeOutlined style={{ fontSize: 18, color: "#007b7f" }} />}
          onClick={() =>
            window.open(
              `${process.env.NEXT_PUBLIC_API_URL}/${record.file}`,
              "_blank"
            )
          }
        />
      ),
    },
    {
      title: "Action",
      render: (_, record) =>
        !record.company_signed ? (
          <Button
            type="primary"
            onClick={() => {
              setCurrentContract(record);
              setSignModalVisible(true);
            }}
          >
            Signer
          </Button>
        ) : (
          <span style={{ color: "green" }}>Déjà signé</span>
        ),
    },
    {
      title: "Statut d’abonnement",
      dataIndex: "status",
      render: (status) => {
        let color = "default";
        if (status === "ACTIVE") color = "green";
        else if (status === "RESILIE") color = "red";
        else if (status === "EN ATTENTE") color = "orange";
        else if (status === "EXPIREE") color = "gray";

        return <span style={{ color }}>{status}</span>;
      },
    },
    {
      title: "Résilier",
      render: (_, record) => {
        const status = record.status;

        const isEligible =
          status !== "RESILIE" &&
          status !== "EXPIREE" &&
          status !== "EN ATTENTE";

        if (!isEligible) return null;

        return (
          <Button
            danger
            onClick={async () => {
              try {
                const token = localStorage.getItem("token");
                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/company/resiliate-contract`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      token,
                    },
                    body: JSON.stringify({
                      company_id: record.company_id,
                      subscription_id: record.company_subscription_id,
                    }),
                  }
                );

                if (!res.ok) throw new Error("Échec résiliation");

                message.success("Contrat résilié avec succès");
                fetchContrats();
              } catch (err) {
                message.error("Erreur lors de la résiliation");
              }
            }}
          >
            Résilier
          </Button>
        );
      },
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f9fbfd" }}>
      <motion.img
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        src="/back_icon.png"
        alt="Retour"
        onClick={handleRetour}
        style={{
          height: 40,
          width: 40,
          position: "fixed",
          top: 20,
          left: 20,
          cursor: "pointer",
        }}
      />
      <Layout.Content style={{ padding: "40px 50px", marginTop: 90 }}>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ textAlign: "center", fontSize: "2rem", color: "#007b7f" }}
        >
          Liste des Contrats
        </motion.h1>

        <Table
          columns={columns}
          dataSource={contratsData}
          loading={loading}
          rowKey="company_subscription_id"
          pagination={{ pageSize: 5 }}
        />

        <Modal
          open={signModalVisible}
          title="Signature du contrat"
          onCancel={() => setSignModalVisible(false)}
          onOk={handleSign}
          okText="Signer"
        >
          <Form layout="vertical" form={signForm}>
            <Form.Item
              name="firstname"
              label="Prénom"
              rules={[{ required: true, message: "Entrez le prénom" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="lastname"
              label="Nom"
              rules={[{ required: true, message: "Entrez le nom" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Signature">
              <SignaturePad
                ref={signatureRef}
                canvasProps={{
                  width: 400,
                  height: 150,
                  style: { border: "1px solid #ccc" },
                }}
              />
            </Form.Item>
            <Button onClick={() => signatureRef.current?.clear()}>
              Effacer
            </Button>
          </Form>
        </Modal>
      </Layout.Content>
    </Layout>
  );
};

export default ContratsPage;
