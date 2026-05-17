import { Navigate } from "react-router-dom";
import { getDefaultRouteForRole } from "../constants/auth";
import { useAuthContext } from "../contexts/AuthContext";
import Login from "../components/Login";

function HomePage() {
  const { isAuthenticated, user } = useAuthContext();

  if (isAuthenticated && user) {
    return <Navigate replace to={getDefaultRouteForRole(user.role)} />;
  }

  return <Login />;
}

export default HomePage;
