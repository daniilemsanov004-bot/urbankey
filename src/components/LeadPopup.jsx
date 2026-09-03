import s from './LeadPopup.module.css'
import { useForm } from "react-hook-form"
import { useState, useContext, useEffect, useRef, useCallback } from "react"
import { toast } from "react-toastify"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"
import { X } from "lucide-react"
import { sendLead } from "../utils/sendLead"
import TurnstileWidget from "./TurnstileWidget"
import { useOnlineStatus } from "../hooks/useOnlineStatus"
import { MyContext } from "../Context"

// Через сколько мс показывать попап, если посетитель просто листает сайт
const TIME_TRIGGER_MS = 45000

// Пути, где уже есть своя форма заявки (Connect / Connect_one) — там
// попап не нужен, будет дублировать то, что человек и так видит
const EXCLUDED_PATHS = [
    "/ContactUs",
    "/login",
    "/register",
    "/reset-password",
    "/forgot-password",
]

const isExcludedPath = (pathname) => {

    if (pathname.startsWith("/admin")) return true;
    if (pathname.startsWith("/property/")) return true;
    if (pathname.startsWith("/commercial/")) return true;

    return EXCLUDED_PATHS.some((p) => pathname.toLowerCase() === p.toLowerCase());
};

const SESSION_KEY = "leadPopupShownAt";
const FOREVER_KEY = "leadPopupDismissedForever";

const LeadPopup = () => {

    const { t } = useTranslation()
    const { isOnline } = useOnlineStatus()
    const { profile } = useContext(MyContext)
    const location = useLocation()

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    const [open, setOpen] = useState(false);
    const [captchaToken, setCaptchaToken] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const shownRef = useRef(false);
    const timerRef = useRef(null);

    const isAdmin = profile?.role === "admin";
    const eligible = !isAdmin && !isExcludedPath(location.pathname);

    const tryShow = useCallback(() => {

        if (shownRef.current) return;
        if (!eligible) return;

        if (localStorage.getItem(FOREVER_KEY) === "1") return;
        if (sessionStorage.getItem(SESSION_KEY)) return;

        shownRef.current = true;
        sessionStorage.setItem(SESSION_KEY, "1");
        setOpen(true);

    }, [eligible]);

    // Триггер по времени
    useEffect(() => {

        if (!eligible) return;

        timerRef.current = setTimeout(tryShow, TIME_TRIGGER_MS);

        return () => clearTimeout(timerRef.current);

    }, [eligible, tryShow]);

    // Exit-intent: курсор уходит за верхнюю границу окна (десктоп).
    // На мобильных этого события не бывает — там сработает только таймер
    useEffect(() => {

        if (!eligible) return;

        const handleMouseLeave = (e) => {
            if (e.clientY <= 0) {
                tryShow();
            }
        };

        document.addEventListener("mouseleave", handleMouseLeave);

        return () => document.removeEventListener("mouseleave", handleMouseLeave);

    }, [eligible, tryShow]);

    const close = () => setOpen(false);

    const dismissForever = () => {
        localStorage.setItem(FOREVER_KEY, "1");
        setOpen(false);
    };

    const sendTelegram = async (data) => {

        setSubmitting(true);

        try {

            await sendLead({
                source: "LeadPopup",
                data,
                captchaToken,
                honeypot: data.company,
                skipCrm: profile?.role === "admin"
            });

            toast.success(t("messageSent"));
            setSent(true);
            reset();
            setCaptchaToken(null);

        } catch (error) {

            console.error(error);
            toast.error(error?.message ? `${t("messageError")}: ${error.message}` : t("messageError"));

        } finally {
            setSubmitting(false);
        }
    };

    const onSubmit = (data) => {
        sendTelegram(data);
    };

    if (!eligible) return null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className={s.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={close}
                >
                    <motion.div
                        className={s.modal}
                        onClick={(e) => e.stopPropagation()}

                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >

                        <button
                            type="button"
                            className={s.closeBtn}
                            onClick={close}
                            aria-label={t("close")}
                        >
                            <X size={20} />
                        </button>

                        {sent ? (

                            <div className={s.thanks}>
                                <h2>{t("leadPopupThanksTitle")}</h2>
                                <p>{t("leadPopupThanksText")}</p>

                                <button
                                    type="button"
                                    className={s.btn}
                                    onClick={close}
                                >
                                    {t("close")}
                                </button>
                            </div>

                        ) : (

                            <>
                                <img
                                    src="/Abstract Design.svg"
                                    alt=""
                                    className={s.logo}
                                />

                                <h2>{t("leadPopupTitle")}</h2>
                                <p className={s.subtitle}>{t("leadPopupText")}</p>

                                <form
                                    className={s.form}
                                    onSubmit={handleSubmit(onSubmit)}
                                >

                                    <div className={s.field}>
                                        <input
                                            className={s.inp}
                                            placeholder={t("firstName")}

                                            {...register("firstname", {
                                                required: {
                                                    value: true,
                                                    message: t("firstNameRequired")
                                                }
                                            })}
                                        />

                                        {errors.firstname && (
                                            <span className={s.error}>
                                                {errors.firstname.message}
                                            </span>
                                        )}
                                    </div>

                                    <div className={s.field}>
                                        <input
                                            className={s.inp}
                                            placeholder={t("phone")}

                                            {...register("phone", {
                                                required: {
                                                    value: true,
                                                    message: t("phoneRequired")
                                                }
                                            })}
                                        />

                                        {errors.phone && (
                                            <span className={s.error}>
                                                {errors.phone.message}
                                            </span>
                                        )}
                                    </div>

                                    <div className={s.field}>
                                        <input
                                            className={s.inp}
                                            type="email"
                                            placeholder={t("leadPopupEmailOptional")}
                                            {...register("email")}
                                        />
                                    </div>

                                    {/* honeypot */}
                                    <input
                                        type="text"
                                        tabIndex={-1}
                                        autoComplete="off"
                                        className={s.honeypot}
                                        aria-hidden="true"
                                        {...register("company")}
                                    />

                                    <TurnstileWidget
                                        className={s.captcha}
                                        onVerify={setCaptchaToken}
                                        onExpire={() => setCaptchaToken(null)}
                                    />

                                    <button
                                        type="submit"
                                        className={s.btn}
                                        disabled={submitting || !isOnline}
                                    >
                                        {!isOnline ? t("offlineWarning") : submitting ? t("sending") : t("sendMessage")}
                                    </button>

                                </form>

                                <button
                                    type="button"
                                    className={s.neverBtn}
                                    onClick={dismissForever}
                                >
                                    {t("leadPopupDontShowAgain")}
                                </button>
                            </>

                        )}

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default LeadPopup
