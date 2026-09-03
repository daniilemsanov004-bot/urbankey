// Обёртка для локализованных маршрутов /:lang/*.
// Синхронизирует сегмент языка в URL с react-i18next и <html lang="">,
// чтобы у RU/EN/UZ версий страниц были разные индексируемые URL (нужно для hreflang).

import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DEFAULT_LANG, isSupportedLang } from "../utils/lang";

const LanguageLayout = () => {
    const { lang } = useParams();
    const { i18n } = useTranslation();
    const valid = isSupportedLang(lang);

    useEffect(() => {
        if (!valid) return;

        if (i18n.language !== lang) {
            i18n.changeLanguage(lang);
        }

        document.documentElement.lang = lang;
    }, [lang, valid, i18n]);

    if (!valid) {
        // Неизвестный/некорректный языковой сегмент — уводим на язык по умолчанию.
        return <Navigate to={`/${DEFAULT_LANG}`} replace />;
    }

    return <Outlet />;
};

export default LanguageLayout;
