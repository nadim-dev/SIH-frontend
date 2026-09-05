import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import './App.css'
import { InstrumentRegister } from './pages/InstrumentRegisteration';
import { TestingScreen } from './pages/TestingScreen';
import { EccentricityTestScreen } from './pages/EccentricityTestScreen';
import { RepeatabilityTestScreen } from './pages/RepeatabilityTestScreen';
import { LoginPage } from './pages/Login';
import { TestingPersonDashboard } from './pages/TestingPersonDashbaord';
import { AdminDashbaord } from './pages/AdminDashboard';
import { AdminReports } from './pages/AdminReports';
import { ProjectStatus } from './pages/ProjectStatus';
import { CertificateVerification } from './pages/CertificateVerification';
import { Supervisordashbaord } from './pages/SupervisorDashboard';
import DashboardLayout from './layout/dashbaordlayout';
import { AuthContext } from './context/authContextByValue';

function useAuth() {
  return useContext(AuthContext);
}

function Loader() {
  return <div className="p-6 text-slate-600">Loading...</div>;
}

function ProtectedLayout() {
  console.log("Protected layout function is running");
  const {currentUser, authLoading } = useAuth();
  console.log("currentUser",currentUser);
 
  if (authLoading){
    return <Loader />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// function RoleRedirect() {
//   console.log("role direct layout function is running");
//   const { currentUser, authLoading } = useAuth();
//   console.log("currentUser",currentUser);

//   if (authLoading){
//     return <Loader />;
//   }

//   if (!currentUser) {
//     return <Navigate to="/login" replace />;
//   }

//   return <Navigate to={getDashboardPath(currentUser.role)} replace />;
// }


const router=createBrowserRouter([
  {
    path:"/",
    element:<ProjectStatus />
  },
  { path:"/certificate/:number", element:<CertificateVerification /> },
  {
     path:"/register/instrument",
     element:<InstrumentRegister/>
  },
  {
    path:"/login",
    element:<LoginPage />
  },
  {
    element:<ProtectedLayout />,
    children:[
      {
        element:<DashboardLayout />,
        children:
          [
             {
                path:"/testing-person/dashboard",
                element:<TestingPersonDashboard />,
             },
             {
                path:"/testing-person/instruments",
                element:<InstrumentRegister />,
             },
             {
                path:"/testing/:id",
                element:<TestingScreen />,
             },
             {
                path:"/testing/:id/eccentricity",
                element:<EccentricityTestScreen />,
             },
             {
                path:"/testing/:id/repeatability",
                element:<RepeatabilityTestScreen />,
             },
             {
                path:"/admin/dashbaord",
                element:<AdminDashbaord/>
             },
             {
                path:"/admin/reports",
                element:<AdminReports/>
             },
             {
                path:"/supervisor/dashbaord",
                element:<Supervisordashbaord/>
             },


          ]
        
      }
    ]

  }

])

function App() {
  return <RouterProvider router={router} />;
}

export default App;
