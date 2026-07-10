import { useState } from "react";
import { supabase } from "../supabase";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { Mail } from "lucide-react";
import TurnstileWidget from "../components/TurnstileWidget";
import s from "./ForgotPassword.module.css";


export default function ForgotPassword() {


    const { t } = useTranslation();


    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const [captchaToken, setCaptchaToken] = useState(null);
    const captchaRequired = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);



    const sendReset = async () => {


        if (!email) {

            toast.error(
                t("enterEmail")
            );

            return;
        }

        if (captchaRequired && !captchaToken) {

            toast.error(
                t("errors.captchaRequired")
            );

            return;
        }



        setLoading(true);



        const { error } =

            await supabase.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo: `${window.location.origin}/reset-password`,
                    captchaToken: captchaToken || undefined
                }
            );



        setLoading(false);

        setCaptchaToken(null);



        if (error) {

            toast.error(
                error.message
            );

            return;

        }



        toast.success(
            t("resetSent")
        );


    };





    return (

        <main className={s.page}>


            <section className={s.card}>


                <div className={s.icon}>
                    <Mail size={35} />
                </div>



                <h1>
                    {t("forgotPassword")}
                </h1>


                <p>
                    {t("resetDescription")}
                </p>



                <input

                    placeholder="Email"

                    value={email}

                    onChange={
                        e => setEmail(e.target.value)
                    }

                />



                <TurnstileWidget
                    className={s.captcha}
                    onVerify={setCaptchaToken}
                    onExpire={() => setCaptchaToken(null)}
                />



                <button
                    onClick={sendReset}
                    disabled={loading || (captchaRequired && !captchaToken)}
                >

                    {
                        loading
                            ?
                            "..."
                            :
                            t("send")
                    }

                </button>



            </section>


        </main>

    );

}