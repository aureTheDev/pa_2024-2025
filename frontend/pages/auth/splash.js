import { useEffect } from "react";
import { useRouter } from "next/router";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.push("/auth/login");
    }, 2000); // Redirection après 2 secondes
  }, []);

  return (
    <div className="splash-container">
      <img
        src="/logo_alone.png"
        alt="BusinessCare Logo"
        className="splash-logo"
      />
    </div>
  );
}
