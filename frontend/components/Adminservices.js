import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Layout,
  Table,
  Typography,
  Spin,
  Tag,
  Button,
  Modal,
  Descriptions,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

const { Title } = Typography;

const AdminAllServices = () => {
  const [loading, setLoading] = useState(true);
  const [servicesSummary, setServicesSummary] = useState([]);
  const [interventionSummary, setInterventionSummary] = useState([]);
  const [visibleContractors, setVisibleContractors] = useState(null);
  const [contractorsList, setContractorsList] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchSummary = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/services`,
        {
          headers: { "Content-Type": "application/json", token },
        }
      );
      const data = await res.json();
      setServicesSummary(data.services);
      setInterventionSummary(data.interventions);
    } catch (err) {
      console.error("Erreur de chargement", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContractorsByService = async (serviceName) => {
    if (!token) return;
    setLoadingModal(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/services/${serviceName}/contractors`,
        {
          headers: { "Content-Type": "application/json", token },
        }
      );
      const data = await res.json();
      setContractorsList(data);
      setVisibleContractors(serviceName);
    } catch (err) {
      console.error("Erreur de chargement des contractors", err);
    } finally {
      setLoadingModal(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const serviceColumns = [
    { title: "Service", dataIndex: "service", key: "service" },
    { title: "Nombre de prestataires", dataIndex: "count", key: "count" },
    {
      title: "Voir",
      key: "action",
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => fetchContractorsByService(record.service)}
        />
      ),
    },
  ];

  const contractorColumns = [
    { title: "ID", dataIndex: "contractor_id", key: "contractor_id" },
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Intervention", dataIndex: "intervention", key: "intervention" },
    { title: "Site web", dataIndex: "website", key: "website" },
  ];

  const interventionColumns = [
    {
      title: "Type d'intervention",
      dataIndex: "intervention",
      key: "intervention",
    },
    { title: "Nombre de prestataires", dataIndex: "count", key: "count" },
  ];

  return (
    <Layout
      style={{ minHeight: "100vh", background: "#f9fbfd", overflowX: "auto" }}
    >
      <motion.img
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        src="/back_icon.png"
        alt="Retour"
        onClick={() => router.push("/admin/accueil")}
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
          width: "90%",
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
          Resumé des services
        </motion.h1>
        {loading ? (
          <Spin size="large" />
        ) : (
          <>
            <Table
              dataSource={servicesSummary}
              columns={serviceColumns}
              rowKey="service"
              pagination={false}
              style={{ marginBottom: 40 }}
            />

            <Title level={4}>Répartition par type d'intervention</Title>
            <Table
              dataSource={interventionSummary}
              columns={interventionColumns}
              rowKey="intervention"
              pagination={false}
              style={{ width: 400 }}
            />

            <Modal
              open={!!visibleContractors}
              title={`Prestataires pour le service: ${visibleContractors}`}
              footer={null}
              onCancel={() => setVisibleContractors(null)}
              width={800}
            >
              {loadingModal ? (
                <Spin />
              ) : (
                <Table
                  dataSource={contractorsList}
                  columns={contractorColumns}
                  rowKey="contractor_id"
                  pagination={false}
                />
              )}
            </Modal>
          </>
        )}
      </Layout.Content>
    </Layout>
  );
};

export default AdminAllServices;
