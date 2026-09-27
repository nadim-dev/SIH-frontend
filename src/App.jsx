import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useContext } from "react";
import "./App.css";
import { InstrumentRegister } from "./pages/InstrumentRegisteration";
import { TestingScreen } from "./pages/TestingScreen";
import { EccentricityTestScreen } from "./pages/Tests/EccentricityTestScreen";
import { RepeatabilityTestScreen } from "./pages/Tests/RepeatabilityTestScreen";
import { LoginPage } from "./pages/Login";
import { TestingPersonDashboard } from "./pages/TestingPersonDashbaord";
import { TestingPersonReports } from "./pages/TestingPersonReports";
import { AdminDashbaord } from "./pages/Admin/aadminDashboard";
import { AdminReports } from "./pages/AdminReports";
import { AdminReportsPage } from "./pages/Admin/AdminReportsPage";
import AuditLog from "./pages/Admin/auditlog";
import { ProjectStatus } from "./pages/ProjectStatus";
import { CertificateVerification } from "./pages/CertificateVerification";
import { ReportVerification } from "./pages/ReportVerification";
import { Supervisordashbaord } from "./pages/SupervisorDashboard";
import DashboardLayout from "./layout/dashbaordlayout";
import { AuthContext } from "./context/authContextByValue";
import { InstrumentWorkFlow } from "./pages/InstrumentWorkflowPage";
import { InstrumentDocumentation } from "./pages/InstrumentDocumentation";
import { LaboratoryEnvironment } from "./pages/LaboratoryEnvironment";
import { InstrumentTestPlan } from "./pages/InstrumentTestPlan";
import { InstrumentTestExecution } from "./pages/InstrumentTestExecution";
import GeneralExamination from "./pages/Tests/GeneralExamination";
import { ManageTestingOfficersPage } from "./pages/Supervisor/ManageTestingOfficersPage";
import { NonComplianceReportPage } from "./pages/Supervisor/NonComplianceReportPage";
import { TareTest } from "./pages/Tests/TareTest";
import { TempretureTest } from "./pages/Tests/TempretureTest";
import { SupervisorEvaluation } from "./pages/Supervisor/SupervisorEvaluation";
import { SupervisorEvaluationReview } from "./pages/Supervisor/SupervisorEvaluationReview";
import { SupervisorReport } from "./pages/Supervisor/SupervisorReport";
import { SupervisorReportsPage } from "./pages/Supervisor/SupervisorReportsPage";
import { SupervisorKeyMetrics } from "./pages/Supervisor/SupervisorKeyMetrics";
import { NotificationsPage } from "./pages/NotificationsPage";
import { AddLaboratory, ManageLabs } from "./pages/Admin/ManageLabs";
import { AdminUsers } from "./pages/Admin/AdminUsers";
import ProfilePage from "./pages/ProfilePage";
import SupervisorLaboratoryProfile from "./pages/SupervisorLaboratoryProfile";
import { AssistantPage } from "./pages/AssistantPage";


function useAuth() {
  return useContext(AuthContext);
}

function Loader() {
  return <div className="p-6 text-slate-600">Loading...</div>;
}

function ProtectedLayout() {
  console.log("Protected layout function is running");
  const { currentUser, authLoading } = useAuth();
  console.log("currentUser", currentUser);

  if (authLoading) {
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

const router = createBrowserRouter([
  {
    path: "/",
    element: <ProjectStatus />,
  },
  { path: "/certificate/:number", element: <CertificateVerification /> },
  { path: "/verify-report/:reportId", element: <ReportVerification /> },
  {
    path: "/register/instrument",
    element: <InstrumentRegister />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/profile", element: <ProfilePage /> },
          { path: "/testing-person/profile", element: <ProfilePage /> },
          {
            path: "/testing-person/dashboard",
            element: <TestingPersonDashboard />,
          },
          {
            path: "/testing-person/reports",
            element: <TestingPersonReports />,
          },
          {
            path: "/testing-person/assistant",
            element: <AssistantPage/>,
          },
          {
            path: "/testing-person/instruments",
            element: <InstrumentRegister />,
          },
          {
            path: "/testing/:applicationId/workflow",
            element: <InstrumentWorkFlow />,
          },
          {
            path: "/testing/:applicationId/report",
            element: <SupervisorReport />,
          },
          {
            path: "/testing/:applicationId/test-plan",
            element: <InstrumentTestPlan />,
          },
          {
            path: "/testing/:instrumentId/general-examination",
            element: <GeneralExamination />,
          },
          {
            path: "/testing/:applicationId/test-execution",
            element: <InstrumentTestExecution />,
          },
          {
            path: "/testing/:applicationId/document-upload",
            element: <InstrumentDocumentation />,
          },
          {
            path: "/testing/:applicationId/laboratory-enviroment",
            element: <LaboratoryEnvironment />,
          },

          {
            path: "/testing/:id/weighingtest",
            element: <TestingScreen />,
          },
          {
            path: "/testing/:id/eccentricity",
            element: <EccentricityTestScreen />,
          },
          {
            path: "/testing/:id/repeatability",
            element: <RepeatabilityTestScreen />,
          },
          {
            path: "/testing/:id/temperature-influence",
            element: <TempretureTest />,
          },
          {
            path: "/admin/dashbaord",
            element: <AdminDashbaord />,
          },
          {
            path: "/admin/reports",
            element: <AdminReportsPage />,
          },
          {
            path: "/admin/audit-logs",
            element: <AuditLog />,
          },
          {
            path: "/admin/laboratories",
            element: <ManageLabs />,
          },
          {
            path: "/admin/users",
            element: <AdminUsers />,
          },
          {
            path: "/admin/laboratories/add",
            element: <AddLaboratory />,
          },
          {
            path: "/testing/:id/tare",
            element: <TareTest />,
          },
          {
            path: "/supervisor/dashbaord",
            element: <Supervisordashbaord />,
          },
          {
            path: "/supervisor/laboratory-profile",
            element: <SupervisorLaboratoryProfile />,
          },
          {
            path: "/supervisor/key-metrics",
            element: <SupervisorKeyMetrics />,
          },
          {
            path: "/supervisor/testing-officers",
            element: <ManageTestingOfficersPage />,
          },
          {
            path: "/supervisor/evaluations",
            element: <SupervisorEvaluation />,
          },
          {
            path: "/supervisor/evaluations/:applicationId/review",
            element: <SupervisorEvaluationReview />,
          },
          {
            path: "/supervisor/reports/:applicationId",
            element: <SupervisorReport />,
          },
          {
            path: "/supervisor/non-compliance",
            element: <NonComplianceReportPage />,
          },
          {
            path: "/supervisor/non-compliance",
            element: <Supervisordashbaord />,
          },
          {
            path: "/supervisor/reports",
            element: <SupervisorReportsPage />,
          },
          { path: "/supervisor/notifications", element: <NotificationsPage /> },
          {
            path: "/testing-person/notifications",
            element: <NotificationsPage />,
          },
          {
            path: "/admin/notifications",
            element: <NotificationsPage />,
          },
          {},
        ],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
