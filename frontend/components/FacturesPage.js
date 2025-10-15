import { useState, useEffect } from "react";
import { Layout, Popover, Checkbox, Button, Table } from "antd";
import { FilterOutlined, EyeOutlined } from "@ant-design/icons";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { loadStripe } from "@stripe/stripe-js";

const AntButton = dynamic(() => import("antd/es/button"), { ssr: false });
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

const FacturesPage = ({ factures }) => {
  const [filteredData, setFilteredData] = useState(factures);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const router = useRouter();

  const checkboxOptions = [
    { label: "Factures payées", value: "payed" },
    { label: "Factures non payées", value: "notPayed" },
  ];

  useEffect(() => {
    const fetchUpdatedFactures = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/company/bills`,
          {
            headers: {
              "Content-Type": "application/json",
              token: token,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Erreur lors du rafraîchissement des factures");
        }
        const updatedFactures = await response.json();
        setFilteredData(updatedFactures);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUpdatedFactures();
  }, []);

  const handleRetour = () => {
    router.push("/societes/accueil");
  };

  const applyFilters = () => {
    let updatedData = [...factures];
    if (selectedFilters.includes("payed")) {
      updatedData = updatedData.filter((f) => f.payed === true);
    }
    if (selectedFilters.includes("notPayed")) {
      updatedData = updatedData.filter((f) => f.payed === false);
    }
    setFilteredData(updatedData);
    setPopoverVisible(false);
  };

  const handlePayment = async (companyId, companySubscriptionId) => {
    try {
      const token = localStorage.getItem("token");
      localStorage.setItem(
        "pending_payment_subscription_id",
        companySubscriptionId
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/company/subscription_payement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: token,
          },
          body: JSON.stringify({
            company_id: companyId,
            subscription_id: companySubscriptionId,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Erreur HTTP : ${res.status}`);
      }

      const { checkout_session_id } = await res.json();
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: checkout_session_id
      });
      if (error) {
        console.error("Stripe redirection error:", error);
      }
    } catch (error) {
      console.error("Erreur lors du paiement :", error);
    }
  };

  const columns = [
    {
      title: "Référence",
      dataIndex: "company_subscription_id",
      key: "company_subscription_id",
    },
    {
      title: "Fichier",
      dataIndex: "file",
      render: (filePath) => {
        const parts = filePath.split("/");
        return parts[parts.length - 1];
      },
    },
    {
      title: "Voir",
      render: (_, record) => (
        <AntButton
          type="text"
          icon={<EyeOutlined style={{ fontSize: 18, color: "#007b7f" }} />}
          onClick={() =>
            window.open(
              `${process.env.NEXT_PUBLIC_API_URL}/${record.file}`,
              "_blank"
            )
          }
          style={{ display: "block", margin: "auto" }}
        />
      ),
    },
    {
      title: "Statut",
      dataIndex: "payed",
      key: "payed",
      render: (payed) => (
        <span
          style={{
            color: payed ? "#007b7f" : "#d32029",
            fontWeight: 600,
          }}
        >
          {payed ? "Payée" : "Non payée"}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) =>
        record.payed === false ? (
          <Button
            type="primary"
            style={{
              backgroundColor: "#007b7f",
              borderColor: "#007b7f",
            }}
            onClick={() =>
              handlePayment(record.company_id, record.company_subscription_id)
            }
          >
            Payer
          </Button>
        ) : (
          ""
        ),
    },
  ];

  const popoverContent = (
    <div style={{ minWidth: 240 }}>
      <Checkbox.Group
        options={checkboxOptions}
        value={selectedFilters}
        onChange={setSelectedFilters}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          paddingBottom: 8,
        }}
      />
      <Button
        type="primary"
        block
        onClick={applyFilters}
        style={{ backgroundColor: "#007b7f", borderColor: "#007b7f" }}
      >
        ✅ Valider
      </Button>
    </div>
  );

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
          background: "#f9fbfd",
          marginTop: "90px",
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
          Liste des Factures
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div style={{ maxWidth: "1200px", margin: "auto", width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginBottom: 16,
                gap: 10,
              }}
            >
              <Popover
                content={popoverContent}
                title="Filtrer les factures"
                trigger="click"
                placement="bottomLeft"
                open={popoverVisible}
                onOpenChange={(visible) => setPopoverVisible(visible)}
              >
                <Button icon={<FilterOutlined />} style={{ color: "#007b7f" }}>
                  Filtrer
                </Button>
              </Popover>
            </div>

            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="bill_id"
              pagination={{ pageSize: 5 }}
              bordered
            />
          </div>
        </motion.div>
      </Layout.Content>
    </Layout>
  );
};

export default FacturesPage;