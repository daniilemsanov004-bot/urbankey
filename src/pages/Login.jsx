import s from "./Register.module.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../supabase";
import { toast } from "react-toastify";
import TurnstileWidget from "../components/TurnstileWidget";


const Login = () => {

    const { t } = useTranslation();

    const navigate = useNavigate();


    const [showPassword, setShowPassword] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [captchaToken, setCaptchaToken] = useState(null);
    const captchaRequired = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);



    const getErrorMessage = (error) => {

        const msg = error?.message || "";

        if (msg.includes("Invalid login credentials")) {
            return t("errors.invalidCredentials");
        }

        if (msg.includes("Email not confirmed")) {
            return t("errors.emailNotConfirmed");
        }

        if (msg.includes("User not found")) {
            return t("errors.userNotFound");
        }

        if (msg.includes("Too many requests")) {
            return t("errors.tooManyRequests");
        }

        return t("errors.generic");

    };
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



    const handleSubmit = async (e) => {

        e.preventDefault();

        if (captchaRequired && !captchaToken) {
            toast.error(t("errors.captchaRequired"));
            return;
        }


        const { data, error } =
            await supabase.auth.signInWithPassword({

                email: email.trim(),

                password: password.trim(),

                options: {
                    captchaToken: captchaToken || undefined
                }

            });



        if (error) {

            console.error(error);

            toast.error(getErrorMessage(error));

            setCaptchaToken(null);

            return;

        }



        await new Promise(resolve => setTimeout(resolve, 300));


        navigate("/", {
            replace: true
        });


    };




    return (

        <section className={s.register}>


            <form
                className={s.form}
                onSubmit={handleSubmit}
            >


                <h2>
                    {t("login")}
                </h2>



                <input
                    type="email"
                    placeholder={t("registerEmail")}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />



                <div className={s.passwordBox}>


                    <input

                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }

                        placeholder={t("registerPassword")}

                        value={password}

                        onChange={e =>
                            setPassword(e.target.value)
                        }

                        required

                    />


                    <button

                        type="button"

                        className={s.eye}

                        onClick={() =>
                            setShowPassword(!showPassword)
                        }

                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}

                    </button>


                </div>




                <TurnstileWidget
                    onVerify={setCaptchaToken}
                    onExpire={() => setCaptchaToken(null)}
                    className={s.captcha}
                />

                <button type="submit" disabled={captchaRequired && !captchaToken}>
                    {t("login")}
                </button>

                <div className={s.divider}>
                    <span>{t("or")}</span>
                </div>

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

                <Link to="/forgot-password" className={s.forgot}>
                    {t("forgotPassword")}
                </Link>
                <p className={s.bottom}>

                    {t("noAccount")}

                    <Link to="/register">

                        {t("registerButton")}

                    </Link>

                </p>



            </form>


        </section>

    );

};


export default Login;