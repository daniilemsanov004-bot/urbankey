import { Link } from "react-router-dom";
import s from "./Burger.module.css";
import { useContext } from "react";
import { MyContext } from "../Context";
import { useTranslation } from "react-i18next";

const Burger = () => {

    const { handleBurger, isBurger } = useContext(MyContext);

    const { t } = useTranslation()

    return (
        <div
            className={
                isBurger
                    ? `${s.burger} ${s.active}`
                    : s.burger
            }
        >
            <div className={s.container}>

                <img
                    className={s.close}
                    src="/close (6).svg"
                    alt="close"
                    onClick={handleBurger}
                />

                <div className={s.links}>

                    <Link
                        className={s.link}
                        to={"/"}
                        onClick={handleBurger}
                    >
                        {t("home")}
                    </Link>

                    <Link
                        className={s.link}
                        to={"/AboutUs"}
                        onClick={handleBurger}
                    >
                        {t("aboutUs")}
                    </Link>

                    <Link
                        className={s.link}
                        to={"/Properties"}
                        onClick={handleBurger}
                    >
                        {t("properties")}
                    </Link>

                    <Link
                        className={s.link}
                        to={"/Services"}
                        onClick={handleBurger}
                    >
                        {t("services")}
                    </Link>

                    <Link
                        className={s.link}
                        to={"/ContactUs"}
                        onClick={handleBurger}
                    >
                        {t("contactUs")}
                    </Link>

                </div>

            </div>
        </div>
    );
};

export default Burger;