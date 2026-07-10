import s from "./Register.module.css"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { Eye, EyeOff } from "lucide-react"
import { supabase } from "../supabase";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import TurnstileWidget from "../components/TurnstileWidget";


const Register = () => {

    const { t } = useTranslation()

    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate();

    const [captchaToken, setCaptchaToken] = useState(null);
    const captchaRequired = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    })

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        })
    }
    const handleGoogleLogin = async () => {

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) {
            toast.error(getErrorMessage(error));
        }

    };

    const getErrorMessage = (error) => {

        const msg = error?.message || "";

        if (msg.includes("User already registered")) {
            return t("errors.userExists");
        }

        if (msg.includes("Password should be at least")) {
            return t("errors.weakPassword");
        }

        if (msg.includes("Unable to validate email address")) {
            return t("errors.invalidEmail");
        }

        if (msg.includes("Signup requires a valid password")) {
            return t("errors.invalidPassword");
        }

        if (msg.includes("Too many requests")) {
            return t("errors.tooManyRequests");
        }

        return t("errors.generic");

    };


    const handleSubmit = async (e) => {

        e.preventDefault();

        if (captchaRequired && !captchaToken) {
            toast.error(t("errors.captchaRequired"));
            return;
        }


        const { data, error } =
            await supabase.auth.signUp({

                email: form.email,

                password: form.password,

                options: {
                    data: {
                        name: form.name
                    },
                    captchaToken: captchaToken || undefined
                }

            });



        if (error) {

            toast.error(getErrorMessage(error));
            setCaptchaToken(null);
            return;

        }



        if (!data.user) {

            toast.error(t("errors.generic"));

            return;

        }



        toast.success(t("errors.confirmEmailSent"));
        navigate("/login");

    }
    return (
        <section className={s.register}>

            <div className={s.blur1}></div>
            <div className={s.blur2}></div>

            <motion.form
                initial={{ opacity: 0, y: 80 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className={s.form}
                onSubmit={handleSubmit}
            >

                <h2>{t("registerTitle")}</h2>

                <input
                    type="text"
                    placeholder={t("registerName")}
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                />

                {
                    !form.name && (
                        <span className={s.required}>
                            * {t("requiredField")}
                        </span>
                    )
                }

                <input
                    type="email"
                    placeholder={t("registerEmail")}
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />

                {
                    !form.email && (
                        <span className={s.required}>
                            * {t("requiredField")}
                        </span>
                    )
                }

                <div className={s.passwordBox}>

                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder={t("registerPassword")}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />

                    <button
                        type="button"
                        className={s.eye}
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>

                </div>

                {
                    !form.password && (
                        <span className={s.required}>
                            * {t("requiredField")}
                        </span>
                    )
                }

                <TurnstileWidget
                    onVerify={setCaptchaToken}
                    onExpire={() => setCaptchaToken(null)}
                    className={s.captcha}
                />

                <button type="submit" disabled={captchaRequired && !captchaToken}>
                    {t("registerButton")}
                </button>
                <button
                    type="button"
                    className={s.googleBtn}
                    onClick={handleGoogleLogin}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {t("loginWithGoogle")}
                </button>

                <p className={s.bottom}>
                    {t("haveAccount")}

                    <Link to="/login">
                        {t("login")}
                    </Link>
                </p>

            </motion.form>

        </section>
    )
}

export default Register