import s from './Connect.module.css'
import { useForm } from "react-hook-form"
import { useState, useContext } from "react"
import { toast } from "react-toastify"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { sendLead } from "../utils/sendLead"
import TurnstileWidget from "./TurnstileWidget"
import { useOnlineStatus } from "../hooks/useOnlineStatus"
import { MyContext } from "../Context"

const Connect = () => {

    const { t } = useTranslation()
    const { isOnline } = useOnlineStatus()
    const { profile } = useContext(MyContext)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    const [captchaToken, setCaptchaToken] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const sendTelegram = async (data) => {

        setSubmitting(true);

        try {

            await sendLead({
                source: "Connect",
                data,
                captchaToken,
                honeypot: data.company,
                skipCrm: profile?.role === "admin"
            });

            toast.success(t("messageSent"));
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

    const fadeUp = {
        hidden: {
            opacity: 0,
            y: 100,
            scale: 0.9,
            filter: "blur(12px)"
        },

        visible: (custom) => ({
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",

            transition: {
                duration: 0.9,
                delay: custom * 0.12,
                ease: [0.22, 1, 0.36, 1]
            }
        })
    };

    return (

        <section className={s.connect} id='connect'>

            <motion.div
                className={s.text}

                initial={{
                    opacity: 0,
                    y: 80,
                    filter: "blur(10px)"
                }}

                whileInView={{
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)"
                }}

                transition={{
                    duration: 1,
                    ease: [0.22, 1, 0.36, 1]
                }}

                viewport={{
                    once: true,
                    amount: 0.3
                }}
            >

                <img
                    src="/Abstract Design.svg"
                    alt=""
                    className={s.logo}
                />

                <h1>
                    {t("connectTitle")}
                </h1>

                <div className={s.titles}>
                    <p>
                        {t("connectText")}
                    </p>
                </div>

            </motion.div>

            <motion.form
                className={s.requestForm}
                onSubmit={handleSubmit(onSubmit)}

                initial="hidden"
                whileInView="visible"

                viewport={{
                    once: true,
                    amount: 0.2
                }}
            >

                <div className={s.block}>

                    <motion.div
                        className={s.first}
                        variants={fadeUp}
                        custom={1}
                    >

                        <h1>{t("firstName")}</h1>

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

                    </motion.div>

                    <motion.div
                        className={s.second}
                        variants={fadeUp}
                        custom={2}
                    >

                        <h1>{t("lastName")}</h1>

                        <input
                            className={s.inp}
                            placeholder={t("lastName")}

                            {...register("secondname", {
                                required: {
                                    value: true,
                                    message: t("lastNameRequired")
                                }
                            })}
                        />

                        {errors.secondname && (
                            <span className={s.error}>
                                {errors.secondname.message}
                            </span>
                        )}

                    </motion.div>

                    <motion.div
                        className={s.email}
                        variants={fadeUp}
                        custom={3}
                    >

                        <h1>{t("email")}</h1>

                        <input
                            className={s.inp}
                            type="email"
                            placeholder={t("email")}

                            {...register("email", {
                                required: {
                                    value: true,
                                    message: t("emailRequired")
                                }
                            })}
                        />

                        {errors.email && (
                            <span className={s.error}>
                                {errors.email.message}
                            </span>
                        )}

                    </motion.div>

                    <motion.div
                        className={s.phone}
                        variants={fadeUp}
                        custom={4}
                    >

                        <h1>{t("phone")}</h1>

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

                    </motion.div>

                    <motion.div
                        className={s.type}
                        variants={fadeUp}
                        custom={5}
                    >

                        <h1>{t("inquiryType")}</h1>

                        <select
                            className={s.select}

                            {...register("inquiry", {
                                required: {
                                    value: true,
                                    message: t("inquiryRequired")
                                }
                            })}
                        >

                            <option value="">
                                {t("selectInquiry")}
                            </option>

                            <option>
                                {t("buyingProperty")}
                            </option>

                            <option>
                                {t("sellingProperty")}
                            </option>

                            <option>
                                {t("investmentOpportunities")}
                            </option>

                            <option>
                                {t("realEstateConsultation")}
                            </option>

                            <option>
                                {t("other")}
                            </option>

                        </select>

                    </motion.div>

                    <motion.div
                        className={s.how}
                        variants={fadeUp}
                        custom={6}
                    >

                        <h1>{t("hearAboutUs")}</h1>

                        <select
                            className={s.select}

                            {...register("hear", {
                                required: {
                                    value: true,
                                    message: t("fieldRequired")
                                }
                            })}
                        >

                            <option value="">
                                {t("select")}
                            </option>

                            <option>Google</option>
                            <option>Instagram</option>
                            <option>TikTok</option>
                            <option>Facebook</option>
                            <option>{t("friends")}</option>
                            <option>YouTube</option>
                            <option>{t("other")}</option>

                        </select>

                    </motion.div>

                </div>

                <motion.div
                    className={s.message}
                    variants={fadeUp}
                    custom={7}
                >

                    <h1>{t("message")}</h1>

                    <textarea
                        className={s.inp}
                        placeholder={t("yourMessage")}

                        {...register("description", {
                            required: {
                                value: true,
                                message: t("messageRequired")
                            }
                        })}
                    />

                </motion.div>

                {/* honeypot: скрыто от людей через CSS, боты обычно заполняют всё подряд */}
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

                <motion.button
                    className={s.btn}
                    type="submit"
                    disabled={submitting || !isOnline}

                    initial={{
                        opacity: 0,
                        y: 40
                    }}

                    whileInView={{
                        opacity: 1,
                        y: 0
                    }}

                    transition={{
                        duration: 0.8,
                        delay: 0.9
                    }}

                    whileHover={{
                        scale: 1.05,
                        y: -4
                    }}

                    whileTap={{
                        scale: 0.95
                    }}

                    viewport={{
                        once: true
                    }}
                >
                    {!isOnline ? t("offlineWarning") : submitting ? t("sending") : t("sendMessage")}
                </motion.button>

            </motion.form>

        </section>
    )
}

export default Connect