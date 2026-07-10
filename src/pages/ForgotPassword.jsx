import { useState } from "react";
import { supabase } from "../supabase";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { Mail } from "lucide-react";
import s from "./ForgotPassword.module.css";


export default function ForgotPassword() {


    const { t } = useTranslation();


    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);



    const sendReset = async () => {


        if (!email) {

            toast.error(
                t("enterEmail")
            );

            return;
        }



        setLoading(true);



        const { error } =

            await supabase.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo: `${window.location.origin}/reset-password`
                }
            );



        setLoading(false);



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



                <button
                    onClick={sendReset}
                    disabled={loading}
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