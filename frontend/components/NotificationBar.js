// File: frontend/components/NotificationBar.js
import React, { useEffect, useState } from "react";

const NotificationBar = () => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // Read the query parameter from the URL
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment_status");
    if (paymentStatus) {
      setStatus(paymentStatus);
      // Optionally remove query parameter after displaying notification
      // window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (!status) return null;

  // Determine color based on status
  const backgroundColor = status === "success" ? "green" : status === "cancel" ? "red" : "gray";

  const style = {
    position: "fixed",
    top: "0",
    right: "0",
    width: "50px",
    height: "50px",
    backgroundColor: backgroundColor,
    border: "1px solid #000",
    zIndex: 1000,
  };

  return <div style={style} />;
};

export default NotificationBar;