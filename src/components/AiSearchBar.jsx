import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, ArrowRight, Loader2, Home as HomeIcon, Building2 } from "lucide-react";

import { localizedPath } from "../utils/lang";
import { useCurrency } from "../context/CurrencyContext";
import { formatPriceIn } from "../utils/currency";
import { aiSearchCatalog } from "../utils/aiSearch";
import s from "./AiSearchBar.module.css";

// Крупная строка ИИ-поиска — единая точка входа что на главной (Hero),
// что над каталогом (Find). Жмёшь "Найти" — /api/ai-search разбирает
// запрос через ту же цепочку провайдеров, что и разбор объявлений
// бота, САМ подтягивает подходящие объявления из Supabase и отдаёт
// готовый превью-список — показываем его прямо тут, под строкой
// поиска, "а-ля Uzum" (не отдельная страница результатов, а сразу
// карточки под полем ввода). Ссылка "Смотреть все" внизу списка
// уводит на /Properties?q=... — там та же логика фильтрации, что и
// здесь, только с полным списком, сортировкой и ручными фильтрами.
const AiSearchBar = ({ className = "" }) => {

    const { t, i18n } = useTranslation();
    const { currency } = useCurrency();
    const navigate = useNavigate();

    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null); // null = панель закрыта
    const [lastQuery, setLastQuery] = useState("");

    const blurTimeout = useRef(null);

    const goToFullResults = (query) => {
        navigate(`${localizedPath("/Properties", i18n.language)}?q=${encodeURIComponent(query)}`);
    };

    const submit = async () => {

        const query = value.trim();
        if (!query || loading) return;

        setLoading(true);
        setLastQuery(query);

        try {

            const res = await aiSearchCatalog(query, i18n.language);

            if (!res?.ok) {
                setResults(null);
                goToFullResults(query);
                return;
            }

            setResults(res.results || []);

        } finally {
            setLoading(false);
        }

    };

    const closePanel = () => {
        blurTimeout.current = setTimeout(() => setResults(null), 150);
    };

    const cancelClose = () => {
        if (blurTimeout.current) clearTimeout(blurTimeout.current);
    };

    return (
        <div
            className={`${s.wrap} ${className}`}
            onBlur={closePanel}
            onFocus={cancelClose}
        >

            <div className={s.bar}>

                <Sparkles size={22} className={s.icon} />

                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") submit();
                        if (e.key === "Escape") setResults(null);
                    }}
                    placeholder={t("aiSearchBar.placeholder")}
                />

                <button type="button" className={s.submit} onClick={submit} disabled={loading}>
                    {loading
                        ? <Loader2 size={18} className={s.spin} />
                        : (
                            <>
                                <span>{t("aiSearchBar.button")}</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                </button>

            </div>

            {results !== null && (

                <div className={s.panel} onMouseDown={cancelClose}>

                    {results.length === 0 ? (

                        <div className={s.empty}>
                            <p>{t("aiSearchBar.noResults")}</p>
                            <button
                                type="button"
                                className={s.emptyLink}
                                onClick={() => goToFullResults(lastQuery)}
                            >
                                {t("aiSearchBar.browseAll")}
                            </button>
                        </div>

                    ) : (

                        <>
                            {results.map((item) => (
                                <Link
                                    key={`${item.category}-${item.id}`}
                                    to={localizedPath(item.link, i18n.language)}
                                    className={s.resultItem}
                                    onClick={() => setResults(null)}
                                >

                                    {item.image
                                        ? <img src={item.image} alt="" className={s.resultImg} />
                                        : (
                                            <div className={s.resultImgPlaceholder}>
                                                {item.category === "commercial"
                                                    ? <Building2 size={18} />
                                                    : <HomeIcon size={18} />}
                                            </div>
                                        )}

                                    <div className={s.resultInfo}>
                                        <span className={s.resultTitle}>{item.title}</span>
                                        <span className={s.resultMeta}>
                                            {formatPriceIn(item.price, currency)}
                                            {" · "}
                                            {item.isRent ? t("dealType.rent") : t("dealType.sale")}
                                        </span>
                                    </div>

                                </Link>
                            ))}

                            <button
                                type="button"
                                className={s.viewAll}
                                onClick={() => goToFullResults(lastQuery)}
                            >
                                {t("aiSearchBar.viewAll")}
                                <ArrowRight size={16} />
                            </button>
                        </>

                    )}

                </div>

            )}

        </div>
    );
};

export default AiSearchBar;
