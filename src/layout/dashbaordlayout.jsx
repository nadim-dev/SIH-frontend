import { Outlet } from "react-router-dom";
import { useContext } from "react";
import Header from "../components/Header";
import Sidebar from "../components/sidebar";
import { AuthContext } from "../context/authContextByValue";
import "./dashboardLayout.css";
import { useState } from "react";

export function DashboardLayout() {
  const { currentUser,setCurrentUser } = useContext(AuthContext);
    const [headerContent, setHeaderContent] = useState({
    title: undefined,
    subtitle: undefined,
    action: undefined,
  });

  return (
    <div className="nawi-app-shell">
      <Sidebar />
      <div className="nawi-main-column">
        <Header user={currentUser}  
                title={headerContent.title}
                subtitle={headerContent.subtitle}
               action={headerContent.action}
               setCurrentUser={setCurrentUser} 
        />
        <main className="nawi-content">
          <Outlet context={{ currentUser, setHeaderContent}}/>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
