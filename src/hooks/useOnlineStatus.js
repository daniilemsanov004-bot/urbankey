import { useEffect, useState } from "react";

/* Хук статуса сети. reconnected на короткое время становится true сразу
   после возврата онлайн — удобно, чтобы показать баннер "Подключение
   восстановлено" и затем скрыть его. */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [justReconnected, setJustReconnected] = useState(false);

    useEffect(() => {
        let timer;

        const handleOnline = () => {
            setIsOnline(true);
            setJustReconnected(true);
            timer = setTimeout(() => setJustReconnected(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setJustReconnected(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            clearTimeout(timer);
        };
    }, []);

    return { isOnline, justReconnected };
}
