import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/auth/splash");
  }, []);

  return <div>Redirection en cours...</div>;
}
