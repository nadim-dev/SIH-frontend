import { Outlet } from "react-router-dom";
import { useContext } from "react";
import Header from "../components/Header";
import Sidebar from "../components/sidebar";
import { AuthContext } from "../context/authContextByValue";
import "./dashboardLayout.css";

export function DashboardLayout() {
  const { currentUser } = useContext(AuthContext);

  return (
    <div className="nawi-app-shell">
      <Sidebar />
      <div className="nawi-main-column">
        <Header user={currentUser} />
        <main className="nawi-content"><Outlet /></main>
      </div>
    </div>
  );
}

export default DashboardLayout;
