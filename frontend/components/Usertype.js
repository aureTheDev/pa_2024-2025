import { useState } from "react";
import { useRouter } from "next/router";
import { Layout } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import styles from "../styles/usertype.module.css";
import CustomFooter from "./Footer";

const { Header, Content } = Layout;

const handleLogout = () => {
  console.log("Déconnexion...");
};

export default function UserTypeSelection() {
  const router = useRouter();
  const [userType, setUserType] = useState("");

  const handleSelection = () => {
    if (!userType) return;
    if (userType === "societe") router.push("../societes/inscription");
    if (userType === "salarie") router.push("../salaries/inscription");
    if (userType === "prestataire") router.push("../prestataires/inscription");
  };

  return (
    <Layout className={styles.layout}>
      <Header className={styles.adminHeader}>
        <div className={styles.leftSection}>
          <img src="/logo_alone.png" alt="Logo" className={styles.headerLogo} />
          <span className={styles.logoText}>BusinessCare</span>
          <UserOutlined className={styles.icon} />
        </div>
        <div className={styles.rightSection}>
          <LogoutOutlined className={styles.icon} onClick={handleLogout} />
        </div>
      </Header>
      <Content className={styles.content}>
        <h1 className={styles.mainTitle}>
          Bienvenue sur la plateforme CareConnect
        </h1>
        <div className={styles.userSelectionContainer}>
          <div className={styles.userSelectionBox}>
            <p className={styles.subtitle}>Vous êtes :</p>
            <div className={styles.userSelectionOptions}>
              <label className={styles.optionLabel}>
                <input
                  type="radio"
                  name="userType"
                  value="societe"
                  onChange={(e) => setUserType(e.target.value)}
                />
                Société cliente
              </label>

              <label className={styles.optionLabel}>
                <input
                  type="radio"
                  name="userType"
                  value="prestataire"
                  onChange={(e) => setUserType(e.target.value)}
                />
                Prestataire
              </label>
            </div>
            <div className={styles.buttonContainer}>
              <button
                onClick={handleSelection}
                className={styles.userSelectionButton}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      </Content>
      <CustomFooter className={styles.footerFixed} />
    </Layout>
  );
}
