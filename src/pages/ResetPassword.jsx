import { useState } from "react";
import { supabase } from "../supabase";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import s from "./ResetPassword.module.css";
import { useEffect } from "react";


export default function ResetPassword() {


    const { t } = useTranslation();
    const navigate = useNavigate();


    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);


    const changePassword = async () => {


        if (password.length < 6) {

            toast.error(t("passwordMin"));
            return;

        }


        if (password !== confirm) {

            toast.error(t("passwordMismatch"));
            return;

        }


        setLoading(true);


        const { error } =
            await supabase.auth.updateUser({
                password
            });


        setLoading(false);


        if (error) {

            toast.error(error.message);
            return;

        }


        toast.success(
            t("passwordChanged")
        );


        await supabase.auth.signOut();

        setTimeout(() => {
            navigate("/login");
        }, 1200);


    };
    useEffect(() => {

        const {
            data: listener
        } = supabase.auth.onAuthStateChange(
            async (event) => {

                if (event === "SIGNED_IN") {

                    const { data } = await supabase.auth.getSession();

                    if (data.session) {
                    }

                }

            }
        );


        return () => {
            listener.subscription.unsubscribe();
        };

    }, []);


    return (

        <main className={s.page}>


            <section className={s.card}>


                <div className={s.icon}>
                    <Lock size={36} />
                </div>


                <h1>
                    {t("newPassword")}
                </h1>


                <div className={s.inputBox}>


                    <input

                        type={
                            show
                                ? "text"
                                : "password"
                        }

                        placeholder={t("newPassword")}

                        value={password}

                        onChange={
                            e => setPassword(e.target.value)
                        }

                    />


                    <button
                        type="button"
                        onClick={() => setShow(!show)}
                    >

                        {
                            show
                                ?
                                <EyeOff size={19} />
                                :
                                <Eye size={19} />
                        }


                    </button>


                </div>


                <input

                    className={s.input}

                    type={
                        show
                            ? "text"
                            : "password"
                    }


                    placeholder={t("repeatPassword")}

                    value={confirm}

                    onChange={
                        e => setConfirm(e.target.value)
                    }

                />


                <button

                    className={s.save}

                    onClick={changePassword}

                    disabled={loading}

                >

                    {
                        loading
                            ?
                            "..."
                            :
                            t("savePassword")
                    }


                </button>


            </section>


        </main>

    );

}