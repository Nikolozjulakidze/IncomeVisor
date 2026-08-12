import { Bell, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import ThemeToggleButton from "./ThemeToggleButton.jsx";

const getGreetingKey = () => {
  const h = new Date().getHours();
  if (h < 12) return "topbar.greeting.morning";
  if (h < 18) return "topbar.greeting.afternoon";
  return "topbar.greeting.evening";
};

const formatToday = (lang) =>
  new Date().toLocaleDateString(lang, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const Topbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <header className="h-20 bg-surface border-b border-border-color flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden text-text-secondary hover:text-text-primary transition"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <div>
          <div className="text-lg font-semibold text-text-primary tracking-tight">
            {t(getGreetingKey())}
            {firstName && `, ${firstName}`} 👋
          </div>
          <div className="text-xs text-text-secondary">{formatToday(lang)}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggleButton />
        <button
          title={t("topbar.notifications")}
          className="relative h-10 w-10 rounded-full text-text-secondary hover:bg-surface-alt hover:text-text-primary flex items-center justify-center transition"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-surface" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
