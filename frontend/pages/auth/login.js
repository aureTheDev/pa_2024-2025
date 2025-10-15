import dynamic from "next/dynamic";

const Login = dynamic(() => import("../../components/LoginForm"), {
  ssr: false,
});

export default function LoginPage() {
  return <Login />;
}
