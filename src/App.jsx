import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import './App.css'
import { InstrumentRegister } from './pages/InstrumentRegisteration';
import { TestingScreen } from './pages/TestingScreen';
import { EccentricityTestScreen } from './pages/EccentricityTestScreen';
import { RepeatabilityTestScreen } from './pages/Tests/RepeatabilityTestScreen';
import { LoginPage } from './pages/Login';
import { TestingPersonDashboard } from './pages/TestingPersonDashbaord';
import { AdminDashbaord } from './pages/AdminDashboard';
import { AdminReports } from './pages/AdminReports';
import { ProjectStatus } from './pages/ProjectStatus';
import { CertificateVerification } from './pages/CertificateVerification';
import { Supervisordashbaord } from './pages/SupervisorDashboard';
import DashboardLayout from './layout/dashbaordlayout';
import { AuthContext } from './context/authContextByValue';
import { InstrumentWorkFlow } from './pages/InstrumentWorkflowPage';
import { InstrumentDocumentation } from './pages/InstrumentDocumentation';
import { LaboratoryEnvironment } from './pages/LaboratoryEnvironment';
import {InstrumentTestPlan} from "./pages/InstrumentTestPlan"
import { InstrumentTestExecution } from './pages/InstrumentTestExecution';
import GeneralExamination from './pages/Tests/GeneralExamination';
import { ManageTestingOfficersPage } from './pages/Supervisor/ManageTestingOfficersPage';
import { NonComplianceReportPage } from './pages/Supervisor/NonComplianceReportPage';

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
              path:"/testing/:applicationId/workflow",
              element:<InstrumentWorkFlow/>

             },
             {
              path:"/testing/:applicationId/test-plan",
              element:<InstrumentTestPlan />
             },
             {
               path:"/testing/:instrumentId/general-examination",
               element:<GeneralExamination/>
             },
             {
              path:"/testing/:applicationId/test-execution",
              element:<InstrumentTestExecution />
             },
             {
              path:"/testing/:applicationId/document-upload",
              element:<InstrumentDocumentation/>
             },
             {
              path:"/testing/:applicationId/laboratory-enviroment",
              element:<LaboratoryEnvironment/>
             },
             {
                path:"/testing/:id/weighingtest",
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
             {
              path:"/supervisor/testing-officers",
              element:<ManageTestingOfficersPage/>
             },
             {
              path:"/supervisor/evaluations",
              element:<Supervisordashbaord/>
             },
             {
              path:"/supervisor/non-compliance",
              element:<NonComplianceReportPage />
             },
             {
              path:"/supervisor/non-compliance",
              element:<Supervisordashbaord/>
             },
             {
              path:"/supervisor/reports",
              element:<Supervisordashbaord/>
             },
             {

             }


          ]
        
      }
    ]

  }

])

function App() {
  return <RouterProvider router={router} />;
}

export default App;
