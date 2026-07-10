import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

let scriptLoadingPromise = null;

function loadTurnstileScript() {

    if (window.turnstile) {
        return Promise.resolve();
    }

    if (scriptLoadingPromise) {
        return scriptLoadingPromise;
    }

    scriptLoadingPromise = new Promise((resolve, reject) => {

        const script = document.createElement("script");

        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;

        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Turnstile script failed to load"));

        document.head.appendChild(script);

    });

    return scriptLoadingPromise;
}

const TurnstileWidget = ({ onVerify, onExpire, className }) => {

    const { t } = useTranslation();
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const [failed, setFailed] = useState(false);

    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

    // Храним последние колбэки в ref, чтобы не пересоздавать виджет
    // из-за новых инлайн-функций onVerify/onExpire на каждый ре-рендер
    // родителя (иначе виджет удалялся бы и рендерился заново постоянно).
    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);

    useEffect(() => {
        onVerifyRef.current = onVerify;
        onExpireRef.current = onExpire;
    });

    useEffect(() => {

        if (!siteKey) {
            return;
        }

        let cancelled = false;

        loadTurnstileScript()
            .then(() => {

                if (cancelled || !containerRef.current || !window.turnstile) return;

                widgetIdRef.current = window.turnstile.render(containerRef.current, {

                    sitekey: siteKey,

                    callback: (token) => {
                        onVerifyRef.current?.(token);
                    },

                    "expired-callback": () => {
                        onExpireRef.current?.();
                    },

                    "error-callback": () => {
                        setFailed(true);
                    }

                });

            })
            .catch(() => setFailed(true));

        return () => {

            cancelled = true;

            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
            }

        };

    }, [siteKey]);

    if (!siteKey) {
        return null;
    }

    if (failed) {
        return (
            <p style={{ color: "#e05a5a", fontSize: 13 }}>
                {t("turnstileLoadError")}
            </p>
        );
    }

    return <div ref={containerRef} className={className} />;

};

export default TurnstileWidget;