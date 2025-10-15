import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faYoutube,
  faInstagram,
  faFacebook,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { FaEnvelope } from "react-icons/fa";

import Link from "next/link";
import styles from "../styles/footer.module.css";

const Footer = () => {
  return (
    <div className={styles.footerWrapper}>
      <div className={styles.footerTop}>
        <div className={styles.footerSection}>
          <Link href="/support/contactForm" className={styles.menuLink}>
            <FaEnvelope className={styles.icon} />
            <span>Contact</span>
          </Link>
        </div>
        <div className={styles.footerSection}>
          <h4 className={styles.sectionTitle}>Suivez-nous</h4>
          <div className={styles.socialIcons}>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faYoutube} size="lg" color="#FF0000" />
            </a>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faInstagram} size="lg" color="#C13584" />
            </a>
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faFacebook} size="lg" color="#3b5998" />
            </a>
            <a
              href="https://www.twitter.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faTwitter} size="lg" color="#1DA1F2" />
            </a>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>© 2025 Business Care - Tous droits réservés</p>
      </div>
    </div>
  );
};

export default Footer;
