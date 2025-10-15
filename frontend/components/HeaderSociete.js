import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import { Layout } from "antd";
import {
  SearchOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";

import styles from "../styles/HeaderSociete.module.css";

const { Header } = Layout;

const HeaderSociete = () => {
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: token,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        console.warn(
          "Erreur lors de la déconnexion :",
          err.detail || res.statusText
        );
      }
    } catch (error) {
      console.error("Erreur réseau lors de la déconnexion :", error.message);
    }

    localStorage.removeItem("token");
    document.cookie =
      "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    console.log("Token après logout:", localStorage.getItem("token"));

    router.push("/auth/login");
  }, [router]);

  const handleProfileClick = () => {
    router.push("/societes/profil");
  };

  return (
    <Header className={styles.headerContainer}>
      <div className={styles.topBar}>
        <div className={styles.leftSection}>
          <img src="/logo_alone.png" alt="Logo" className={styles.headerLogo} />
        </div>

        <div className={styles.rightSection}>
          <UserOutlined
            className={styles.icon}
            onClick={handleProfileClick}
            title="Profil"
          />
          <LogoutOutlined
            className={styles.icon}
            onClick={handleLogout}
            title="Déconnexion"
          />
        </div>
      </div>
    </Header>
  );
};

export default HeaderSociete;
