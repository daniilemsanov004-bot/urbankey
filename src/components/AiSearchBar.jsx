import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, ArrowRight } from "lucide-react";

import { localizedPath } from "../utils/lang";
import s from "./AiSearchBar.module.css";

// Крупная строка ИИ-поиска — единая точка входа что на главной (Hero),
// что над каталогом (Find). Жмёшь "Найти" — переходим на отдельную
// страницу каталога (/Properties?q=...), точь-в-точь как поиск на
// Uzum открывает отдельную страницу результатов, а не выпадающую
// панель. Сам разбор запроса через ИИ и применение фильтров
// происходит уже там (src/components/Catalog.jsx, см. useSearchParams
// эффект) — один источник правды для вызова ИИ, чтобы логика не
// расходилась между несколькими местами на сайте.
const AiSearchBar = ({ className = "" }) => {

    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [value, setValue] = useState("");

    const submit = () => {

        const query = value.trim();
        if (!query) return;

        navigate(`${localizedPath("/Properties", i18n.language)}?q=${encodeURIComponent(query)}`);
    };

    return (
        <div className={`${s.bar} ${className}`}>

            <Sparkles size={22} className={s.icon} />

            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") submit();
                }}
                placeholder={t("aiSearchBar.placeholder")}
            />

            <button type="button" className={s.submit} onClick={submit}>
                <span>{t("aiSearchBar.button")}</span>
                <ArrowRight size={18} />
            </button>

        </div>
    );
};

export default AiSearchBar;
