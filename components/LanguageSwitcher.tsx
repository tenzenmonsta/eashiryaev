import { useLanguage } from "../context/LanguageContext";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="langSwitch" role="group" aria-label="Language">
      <button
        type="button"
        className={lang === "en" ? "langBtn langBtnActive" : "langBtn"}
        onClick={() => setLang("en")}
      >
        EN
      </button>
      <button
        type="button"
        className={lang === "ru" ? "langBtn langBtnActive" : "langBtn"}
        onClick={() => setLang("ru")}
      >
        RU
      </button>
    </div>
  );
}
