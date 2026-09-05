import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import leftLoginImage from "../assets/left_login_image.png";
import satyamevIcon from "../assets/satyamev_jayte.png";
import { loginApi } from "../api/authApi";
import { AuthContext } from "../context/authContextByValue";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "kaif123@nawipro.com", password: "Admin@123" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const updateField = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await loginApi(form);
      setCurrentUser(response.currentUser);
      const role = response.currentUser?.role;
      const dashboardByRole = {
        NAWI_ADMIN: "/admin/dashbaord",
        LAB_SUPERVISOR: "/supervisor/dashbaord",
        TESTING_PERSON: "/testing-person/dashboard",
      };

      navigate(dashboardByRole[role] || "/login", { replace: true });
    } catch (requestError) {
      setError(
        requestError.data?.message ||
          requestError.message ||
          "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  };
  const field =
    "flex h-[42px] items-center rounded-md border-[1.5px] border-sky-400 bg-white px-3 text-slate-500 shadow-[0_0_0_1px_rgba(88,170,242,0.12)] focus-within:border-sky-600 focus-within:shadow-[0_0_0_3px_rgba(35,137,223,0.16)]";
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb] p-6 max-[620px]:p-0">
      <div className="flex h-[730px] w-[1440px] max-w-full overflow-hidden rounded-lg bg-white shadow-[0_18px_42px_rgba(16,47,98,0.18)] max-[1440px]:h-[min(730px,calc(100vh-60px))] max-[620px]:min-h-screen max-[620px]:h-auto max-[620px]:flex-col">
        <section className="w-1/2 overflow-hidden max-[620px]:hidden">
          <img
            className="h-full w-full object-fill"
            src={leftLoginImage}
            alt="NAWI Pro weighing instrument compliance platform"
          />
        </section>
        <section className="flex w-1/2 flex-col items-center bg-white px-8 py-[18px] max-[850px]:px-[18px] max-[620px]:w-full max-[620px]:min-h-screen max-[620px]:px-4">
          <header className="flex w-full max-w-[460px] items-center justify-end gap-3 text-[9px] leading-tight text-[#173668] max-[620px]:justify-center">
            <img
              className="h-12 w-[38px] object-contain"
              src={satyamevIcon}
              alt="Satyamev Jayate emblem"
            />
            <span className="h-[34px] w-px bg-[#a9c8b1]" />
            <div className="flex flex-col gap-1">
              <strong className="font-medium">
                Ministry of Consumer Affairs,
                <br />
                Food &amp; Public Distribution
              </strong>
              <small className="text-[#31517d]">
                Department of Consumer Affairs
              </small>
            </div>
          </header>
          <div className="mt-[22px] w-full max-w-[460px] rounded-[10px] bg-white px-9 py-[30px] shadow-[0_9px_25px_rgba(54,91,129,0.08)] max-[850px]:px-[22px] max-[620px]:mt-8">
            <div className="text-center">
              <h1 className="m-0 text-[25px] font-bold leading-tight tracking-[-1.4px] text-[#102f62]">
                Welcome to NAWI{" "}
                <em className="not-italic text-[#119a48]">Pro</em>
              </h1>
              <p className="mb-[22px] mt-1.5 text-sm text-[#597396]">
                Sign in to access your dashboard
              </p>
            </div>
            {error && (
              <div className="mb-3 rounded bg-red-50 px-2.5 py-2 text-[11px] text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <label className="mb-4 block">
                <span className="mb-1.5 block text-[11px] font-extrabold  text-[#274a78]">
                  EMAIL ADDRESS
                </span>
                <div className={field}>
                  <Mail size={16} />
                  <input
                    className="!m-0 !h-full !min-w-0 !flex-1 !border-0 !bg-transparent !px-2 !text-xs !text-[#203f6b] !outline-none !shadow-none"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    required
                  />
                </div>
              </label>
              <label className="mb-4 block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-[#274a78]">
                  PASSWORD
                </span>
                <div className={field}>
                  <LockKeyhole size={16} />
                  <input
                    className="!m-0 !h-full !min-w-0 !flex-1 !border-0 !bg-transparent !px-2 !text-xs !text-[#203f6b] !outline-none !shadow-none"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={updateField}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    className="border-0 bg-transparent text-slate-500"
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <div className="mb-3 flex justify-end">
                <Link
                  className="text-[10px] text-blue-700 no-underline hover:underline"
                  to="/login"
                >
                  Forgot password?
                </Link>
              </div>
              <button
                className="h-9 w-full rounded cursor-pointer  bg-[#096abd] text-[13px] font-bold text-white shadow hover:bg-[#075ca6] disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  "Signing In..."
                ) : (
                  <>
                    Sign In <span className="ml-2  text-lg">→</span>
                  </>
                )}
              </button>
            </form>
            <div className="my-[17px] flex items-center gap-3 text-[10px] font-bold text-[#607b9b] before:h-px before:flex-1 before:bg-[#d8e2ed] after:h-px after:flex-1 after:bg-[#d8e2ed]">
              <span>OR</span>
            </div>
            <div className="flex gap-3 rounded-md bg-[#eef7ff] px-2.5 py-[11px] text-[#18396b]">
              <ShieldCheck className="h-[23px] w-[23px] shrink-0 text-[#0877ed]" />
              <div>
                <strong className="block text-[10px]">
                  Authorized Access Only
                </strong>
                <p className="m-1 text-[9px] leading-tight text-[#536f94]">
                  This system is for authorized laboratories, supervisors
                  <br />
                  and testing personnel only.
                </p>
              </div>
            </div>
          </div>
          <footer className="mt-auto pt-3 text-center text-[8px] tracking-[1.7px] text-[#345781]">
            FOR FAIR TRADE. <span className="ml-1">FOR A BETTER TOMORROW.</span>
            <i className="mx-auto mt-2 block h-0.5 w-[34px] bg-[#19a750]" />
          </footer>
        </section>
      </div>
    </main>
  );
};
