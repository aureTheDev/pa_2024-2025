import React, { useState, useEffect, useCallback } from "react";
import HeaderSalarie from "./HeaderSalarie";
import Footer from "./Footer";
import NotificationBar from "./NotificationBar";
import styles from "../styles/Accueilsalarie.module.css";
import Link from "next/link";
import dynamic from "next/dynamic";
const ChatBot = dynamic(() => import("../components/ChatBot"), { ssr: false });
import {
  FaLightbulb,
  FaComments,
  FaHandsHelping,
  FaHistory,
  FaEnvelope,
  FaUser,
} from "react-icons/fa";

// --- Fonction utilitaire pour récupérer un cookie ---
const getCookie = (cookieName) => {
  if (typeof document === "undefined") {
    return null;
  }
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((row) => row.startsWith(cookieName + "="));
  return cookie ? cookie.split("=")[1] : null;
};

// --- Composant pour gérer le téléchargement de la facture ---
const DownloadBillIntegration = ({ appointmentId, billFileName }) => {
  const handleDownloadBill = useCallback(async () => {
    if (!appointmentId || !billFileName) {
      alert("Informations manquantes pour le téléchargement.");
      return;
    }
    const token = getCookie("access_token");
    if (!token) {
      alert("Session expirée. Veuillez vous reconnecter.");
      return;
    }
    const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/collaborator/medical/bill/${appointmentId}`;
    try {
      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: { token: token },
      });
      if (!response.ok) {
        let errorDetail = `Erreur HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorDetail;
        } catch (e) {}
        throw new Error(`Échec du téléchargement : ${errorDetail}`);
      }
      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      const tempLink = document.createElement("a");
      tempLink.href = fileURL;
      tempLink.setAttribute("download", billFileName);
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error("Erreur téléchargement facture:", error);
      alert(error.message || "Une erreur est survenue lors du téléchargement.");
    }
  }, [appointmentId, billFileName]);

  return (
    <button
      onClick={handleDownloadBill}
      className={styles.downloadButton}
      title={`Télécharger ${billFileName}`}
    >
      Télécharger
    </button>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "Date/Heure inconnue";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Date/Heure invalide";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    console.error("Erreur de formatage de date/heure:", e);
    return dateString;
  }
};

const AccueilSalarie = () => {
  // --- États ---
  const [collaboratorData, setCollaboratorData] = useState(null);
  const [loadingCollaborator, setLoadingCollaborator] = useState(true);
  const [errorCollaborator, setErrorCollaborator] = useState(null);
  const [medicalAppointments, setMedicalAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [errorAppointments, setErrorAppointments] = useState(null);
  const [contractorDetails, setContractorDetails] = useState({});
  const [loadingContractors, setLoadingContractors] = useState(false);

  // --- Chargement des données collaborateur ---
  useEffect(() => {
    const fetchCollaboratorData = async () => {
      setLoadingCollaborator(true);
      setErrorCollaborator(null);
      const token = getCookie("access_token");
      if (!token) {
        setErrorCollaborator("Non connecté.");
        setLoadingCollaborator(false);
        return;
      }
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/collaborator`,
          {
            method: "GET",
            headers: { token: token, "Content-Type": "application/json" },
          }
        );
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ detail: "Erreur inconnue" }));
          if (response.status === 401) {
            setErrorCollaborator("Session expirée. Veuillez vous reconnecter.");
          } else {
            throw new Error(
              `Erreur ${response.status}: ${
                errorData.detail || response.statusText
              }`
            );
          }
        } else {
          const data = await response.json();
          setCollaboratorData(data);
        }
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des données collaborateur:",
          err
        );
        setErrorCollaborator(err.message || "Une erreur est survenue.");
        setCollaboratorData(null);
      } finally {
        setLoadingCollaborator(false);
      }
    };
    fetchCollaboratorData();
  }, []);

  // --- Chargement des rendez-vous médicaux et des prestataires ---
  useEffect(() => {
    if (
      !collaboratorData ||
      !collaboratorData.collaborator_id ||
      loadingCollaborator
    )
      return;
    const token = getCookie("access_token");
    if (!token) {
      setErrorAppointments("Token requis pour charger les RDVs.");
      return;
    }
    const fetchAppointmentsAndContractors = async () => {
      setLoadingAppointments(true);
      setLoadingContractors(true);
      setErrorAppointments(null);
      setContractorDetails({});
      try {
        const dateFilter = new Date().toISOString();
        const appointmentsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/collaborator/medical_appointments/${collaboratorData.collaborator_id}?dateFilter=${dateFilter}`,
          { headers: { token: token } }
        );
        if (!appointmentsResponse.ok) {
          if (appointmentsResponse.status === 404) {
            console.warn("Aucun rendez-vous à venir trouvé.");
            setMedicalAppointments([]);
            setLoadingAppointments(false);
            return;
          } else {
            const errorData = await appointmentsResponse
              .json()
              .catch(() => ({ detail: "Erreur inconnue" }));
            throw new Error(
              `Erreur ${appointmentsResponse.status} (RDVs): ${
                errorData.detail || appointmentsResponse.statusText
              }`
            );
          }
        }
        let appointmentsData = await appointmentsResponse.json();
        // Filtrer pour afficher uniquement les rendez-vous dont le statut n'est pas "CANCELED"
        if (Array.isArray(appointmentsData)) {
          appointmentsData = appointmentsData.filter(
            (app) => app.status !== "CANCELED"
          );
        } else {
          console.warn(
            "Réponse API RDVs non-conforme (pas un tableau):",
            appointmentsData
          );
          appointmentsData = [];
        }
        appointmentsData.sort((a, b) => {
          const dateA = new Date(a.medical_appointment_date).getTime();
          const dateB = new Date(b.medical_appointment_date).getTime();
          if (isNaN(dateA)) return 1;
          if (isNaN(dateB)) return -1;
          return dateA - dateB;
        });
        setMedicalAppointments(appointmentsData);
        setLoadingAppointments(false);

        const uniqueContractorIds = [
          ...new Set(
            appointmentsData.map((app) => app.contractor_id).filter((id) => id)
          ),
        ];
        if (uniqueContractorIds.length > 0) {
          const contractorPromises = uniqueContractorIds.map((id) =>
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/collaborator/contractor/${id}`,
              {
                headers: { token: token },
              }
            )
              .then(async (res) => {
                if (!res.ok) {
                  const errorDetail = await res
                    .json()
                    .then((err) => err.detail)
                    .catch(() => `Statut ${res.status}`);
                  return Promise.reject({
                    id,
                    status: res.status,
                    detail: errorDetail,
                  });
                }
                return res.json();
              })
              .then((data) => ({ id, data }))
              .catch((error) => ({
                id: error.id || id,
                error: true,
                detail: error.detail || `Erreur inconnue`,
              }))
          );
          const results = await Promise.all(contractorPromises);
          const newDetails = {};
          results.forEach((result) => {
            if (result.error) {
              console.error(
                `Erreur fetch prestataire ${result.id}:`,
                result.detail
              );
              newDetails[result.id] = {
                error: true,
                firstname: "Erreur",
                lastname: `(${result.detail})`,
              };
            } else {
              newDetails[result.id] = result.data;
            }
          });
          setContractorDetails(newDetails);
        } else {
          setContractorDetails({});
        }
      } catch (error) {
        console.error("Erreur fetch RDVs/prestataires:", error);
        setErrorAppointments(error.message);
        setLoadingAppointments(false);
        setMedicalAppointments([]);
      } finally {
        setLoadingContractors(false);
      }
    };
    fetchAppointmentsAndContractors();
  }, [collaboratorData, loadingCollaborator]);

  // --- Fonction pour annuler un rendez-vous ---
  const handleCancelAppointment = useCallback(async (appointmentId) => {
    const token = getCookie("access_token");
    if (!token) {
      alert("Veuillez vous reconnecter pour annuler.");
      return;
    }
    if (confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous médical ?")) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/collaborator/medical-appointment/cancel/${appointmentId}`,
          {
            method: "PATCH",
            headers: { token: token, "Content-Type": "application/json" },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail || "Erreur lors de l'annulation du RDV"
          );
        }
        const result = await response.json();
        alert(result.message || "Annulation réussie");
        setMedicalAppointments((prev) =>
          prev.filter((app) => app.medical_appointment_id !== appointmentId)
        );
      } catch (error) {
        console.error("Erreur annulation RDV :", error);
        alert(error.message || "Une erreur est survenue lors de l'annulation.");
      }
    }
  }, []);

  // --- Données statiques du menu ---
  const services = [
    { label: "Prendre un rdv médical", path: "/salaries/rdv_medical" },
  ];

  return (
    <div className={styles.layout}>
      <NotificationBar />
      <HeaderSalarie />
      <div className={styles.mainLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.profile}>
            <img src="/user.jpeg" alt="profil" className={styles.avatar} />
            {loadingCollaborator && <p>Chargement...</p>}
            {errorCollaborator && !loadingCollaborator && (
              <p style={{ color: "red" }}>{errorCollaborator}</p>
            )}
            {collaboratorData && !loadingCollaborator && !errorCollaborator && (
              <p>
                {collaboratorData.firstname} {collaboratorData.lastname}
              </p>
            )}
            {!collaboratorData &&
              !loadingCollaborator &&
              !errorCollaborator && <p>Profil non chargé.</p>}
          </div>
          <nav className={styles.menu}>
            <ul className={styles.menuList}>
              <li className={styles.menuItem}>
                <Link href="/salaries/profile" className={styles.menuLink}>
                  <FaUser className={styles.icon} />
                  <span>Mon profil</span>
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link href="/salaries/conseils" className={styles.menuLink}>
                  <FaLightbulb className={styles.icon} />
                  <span>Nos conseils</span>
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link href="/forum" className={styles.menuLink}>
                  <FaComments className={styles.icon} />
                  <span>Forum</span>
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link href="/salaries/associations" className={styles.menuLink}>
                  <FaHandsHelping className={styles.icon} />
                  <span>Associations</span>
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link href="/salaries/historique" className={styles.menuLink}>
                  <FaHistory className={styles.icon} />
                  <span>Historique des services</span>
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link href="/support/contactForm" className={styles.menuLink}>
                  <FaEnvelope className={styles.icon} />
                  <span>Contact</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        <div className={styles.content}>
          {loadingCollaborator && <p>Chargement du contenu...</p>}
          {errorCollaborator && !loadingCollaborator && (
            <p style={{ color: "red" }}>
              Impossible de charger le contenu : {errorCollaborator}
            </p>
          )}
          {collaboratorData && !loadingCollaborator && !errorCollaborator && (
            <>
              <div className={styles.dashboard_header}>
                <h1>Bienvenue sur CareConnect, {collaboratorData.firstname}</h1>
                <p className={styles.tagline}>
                  Votre partenaire santé & bien-être en entreprise
                </p>
              </div>
              <section className={styles.services}>
                <h2>Catalogue de services</h2>
                <div className={styles.grid}>
                  {services.map((service, i) => (
                    <Link key={i} href={service.path} legacyBehavior>
                      <a className={styles.serviceCard}>
                        <span>{service.label}</span>
                        <span className={styles.plus}>+</span>
                      </a>
                    </Link>
                  ))}
                </div>
              </section>
              <section className={styles.planning}>
                <h2>Mes RDV médicaux à venir</h2>
                {errorAppointments && (
                  <p style={{ color: "red" }}>
                    Erreur chargement RDVs: {errorAppointments}
                  </p>
                )}
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Prestataire</th>
                      <th>Date et Heure</th>
                      <th>Facture</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingAppointments && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center" }}>
                          Chargement des rendez-vous...
                        </td>
                      </tr>
                    )}
                    {!loadingAppointments &&
                      medicalAppointments.length === 0 &&
                      !errorAppointments && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: "center" }}>
                            Aucun rendez-vous médical trouvé.
                          </td>
                        </tr>
                      )}
                    {!loadingAppointments &&
                      medicalAppointments.map((appointment) => {
                        const contractor =
                          contractorDetails[appointment.contractor_id];
                        let contractorName = "Chargement...";
                        if (!loadingContractors) {
                          if (contractor) {
                            if (contractor.error) {
                              contractorName = (
                                <span
                                  style={{ color: "orange" }}
                                  title={contractor.lastname}
                                >
                                  Erreur chargement
                                </span>
                              );
                            } else {
                              contractorName =
                                `${contractor.firstname || ""} ${
                                  contractor.lastname || ""
                                }`.trim() || "Nom inconnu";
                            }
                          } else if (appointment.contractor_id) {
                            contractorName = "Prestataire non trouvé";
                          } else {
                            contractorName = "N/A";
                          }
                        }
                        return (
                          <tr key={appointment.medical_appointment_id}>
                            <td>RDV Médical</td>
                            <td>{contractorName}</td>
                            <td>
                              {formatDate(appointment.medical_appointment_date)}
                            </td>
                            <td>
                              {appointment.bill_file ? (
                                <DownloadBillIntegration
                                  appointmentId={
                                    appointment.medical_appointment_id
                                  }
                                  billFileName={appointment.bill_file}
                                />
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                            <td>
                              <button
                                className={styles.cancelBtn}
                                onClick={() =>
                                  handleCancelAppointment(
                                    appointment.medical_appointment_id
                                  )
                                }
                                title="Annuler ce rendez-vous"
                              >
                                Annuler
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </section>

              <section className={styles.aboutsection}>
                <h2>Qui sommes-nous ?</h2>
                <p>
                  CareConnect est une plateforme innovante dédiée à la gestion
                  des services de santé en entreprise. Nous facilitons la
                  coordination entre les employeurs, salariés, et prestataires.
                </p>
              </section>
            </>
          )}
        </div>
        <aside className={styles.chatbotColumn}>
          {collaboratorData && (
            <>
              <ChatBot collaboratorId={collaboratorData.collaborator_id} />
            </>
          )}
        </aside>
      </div>
      <Footer />

      <style jsx>{`
        .${styles.downloadButton} {
          background-color: #007bff;
          color: white;
          padding: 5px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9em;
          transition: background-color 0.2s;
        }
        .${styles.downloadButton}:hover {
          background-color: #0056b3;
        }
        .${styles.serviceCard} {
          background-color: #e28a82;
          border: none;
          border-radius: 16px;
          padding: 1rem 1.5rem;
          font-weight: bold;
          cursor: pointer;
          width: 220px;
          height: 100px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: transform 0.2s;
          text-decoration: none;
          color: inherit;
        }
        .${styles.serviceCard}:hover {
          transform: translateY(-3px);
        }
        .${styles.serviceCard} span {
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default AccueilSalarie;
