import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function GoogleG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.27-3.13.75-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.87.92 7.52 2.56 10.78z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.9l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function AuthButton({ className = "" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleClick() {
    if (user) {
      await logout();
      navigate("/");
    } else {
      navigate("/signin");
    }
  }

  const initial = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  return (
    <button
      onClick={handleClick}
      aria-label={user ? "Log out" : "Log in"}
      title={user ? "Log out" : "Log in"}
      className={`w-9 h-9 rounded-full overflow-hidden border-2 border-signal/60 bg-panel2 flex-shrink-0 flex items-center justify-center transition-colors hover:bg-panel ${className}`}
    >
      {user ? (
        <span className="text-sm font-display font-bold text-signal">{initial}</span>
      ) : (
        <GoogleG size={18} />
      )}
    </button>
  );
}
