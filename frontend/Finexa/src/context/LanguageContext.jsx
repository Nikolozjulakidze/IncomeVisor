import { createContext, useContext, useMemo, useState } from "react";
import { getTranslation } from "../utils/i18n.js";
import { useAuth } from "./AuthContext.jsx";

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const { user, updateSettings } = useAuth();
  const initialLang = user?.language || "en";
  const [lang, setLang] = useState(initialLang);

  const t = useMemo(() => getTranslation(lang), [lang]);

  const setLanguage = async (newLang) => {
    setLang(newLang);
    try {
      await updateSettings({ language: newLang });
    } catch {
      // ignore — language still applies for the session
    }
  };

  const value = useMemo(
    () => ({
      lang,
      setLanguage,
      t,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
