import { createBrowserRouter, RouterProvider, Navigate, Outlet} from "react-router-dom";
import { useContext } from "react";
import "./App.css";
import { InstrumentRegister } from "./pages/InstrumentRegisteration";
import { TestingScreen } from "./pages/TestingScreen";
import { EccentricityTestScreen } from "./pages/Tests/EccentricityTestScreen";
import { RepeatabilityTestScreen } from "./pages/Tests/RepeatabilityTestScreen";
import { SensitivityTest } from "./pages/Tests/SensitivityTest";
import { LoginPage } from "./pages/Login";
import { TestingPersonDashboard } from "./pages/TestingPersonDashbaord";
import { TestingPersonReports } from "./pages/TestingPersonReports";
import { AdminDashbaord } from "./pages/Admin/aadminDashboard";
import { AdminReportsPage } from "./pages/Admin/AdminReportsPage";
import AuditLog from "./pages/Admin/auditlog";
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
import { OIMLStandardsPage } from "./pages/Admin/OIMLStandardsPage";
import ProfilePage from "./pages/ProfilePage";
import SupervisorLaboratoryProfile from "./pages/SupervisorLaboratoryProfile";
import { AssistantPage } from "./pages/AssistantPage";


function useAuth() {
  return useContext(AuthContext);
}

function Loader() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-800 sm:px-8">
      <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
        <div className="mb-5 h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" aria-hidden="true" />
        <h1 className="text-xl font-semibold tracking-tight">Connecting to NAWI Pro</h1>
        <p className="mt-2 text-sm text-slate-600">Checking your session and preparing your workspace…</p>
        <aside className="mt-7 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm leading-6 text-amber-950">
          <strong className="font-semibold">First visit may take 30–40 seconds.</strong>{" "}
          The backend runs on Render’s free tier and may need time to wake up after a period of inactivity. Subsequent requests should load faster once it is awake.
        </aside>
      </section>
    </main>
  );
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

function HomeRedirect() {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) return <Loader />;
  if (!currentUser) return <Navigate to="/login" replace />;

  const role = String(currentUser.role || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  const dashboardByRole = {
    NAWI_ADMIN: "/admin/dashbaord",
    ADMIN: "/admin/dashbaord",
    ADMINISTRATOR: "/admin/dashbaord",
    LAB_SUPERVISOR: "/supervisor/dashbaord",
    TESTING_OFFICER: "/testing-person/dashboard",
  };

  return <Navigate to={dashboardByRole[role] || "/login"} replace />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeRedirect />,
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
            path: "/testing/:id/sensitivity",
            element: <SensitivityTest />,
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
            path: "/admin/oiml-standards",
            element: <OIMLStandardsPage />,
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
            path: "/admin/laboratories/:labId/profile",
            element: <SupervisorLaboratoryProfile />,
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
