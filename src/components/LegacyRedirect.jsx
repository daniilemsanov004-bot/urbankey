// Клиентский fallback-редирект со старых "голых" URL (без языкового префикса)
// на путь по умолчанию /ru/... Основной, "серверный" редирект настроен в vercel.json
// (см. секцию redirects) — он важнее для SEO (настоящий 301/308 на edge, без загрузки JS).
// Этот компонент — подстраховка для локальной разработки и на случай прямого обращения
// к SPA без прохождения через Vercel-редиректы.

import { Navigate, useLocation } from "react-router-dom";
import { DEFAULT_LANG } from "../utils/lang";

const LegacyRedirect = () => {
    const { pathname, search, hash } = useLocation();

    return <Navigate to={`/${DEFAULT_LANG}${pathname}${search}${hash}`} replace />;
};

export default LegacyRedirect;
