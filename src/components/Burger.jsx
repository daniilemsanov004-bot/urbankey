import { Link, useNavigate } from "react-router-dom";
import s from "./Burger.module.css";
import { useContext } from "react";
import { MyContext } from "../Context";
import { useCurrency } from "../context/CurrencyContext";
import { useTranslation } from "react-i18next";
import { Sun, Moon, LogOut, Heart, Coins, PlusSquare, ListChecks } from "lucide-react";

const LANGUAGES = [
    { code: "ru", label: "Рус" },
    { code: "uz", label: "O'z" },
    { code: "en", label: "Eng" }
];

const Burger = () => {

    const { handleBurger, isBurger, handleDark, isDark, user, profile, logout } = useContext(MyContext);
    const { currency, toggleCurrency } = useCurrency();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        localStorage.setItem("language", lng);
    };

    const handleLogout = async () => {
        const success = await logout();
        handleBurger();
        if (success) navigate("/", { replace: true });
    };

    return (
        <div className={isBurger ? `${s.burger} ${s.active}` : s.burger}>
            <div className={s.container}>

                <img className={s.close} src="/close (6).svg" alt="close" onClick={handleBurger} />

                <div className={s.scroll}>

                    <div className={s.links}>
                        <Link className={s.link} to={"/"} onClick={handleBurger}>{t("home")}</Link>
                        <Link className={s.link} to={"/AboutUs"} onClick={handleBurger}>{t("aboutUs")}</Link>
                        <Link className={s.link} to={"/Properties"} onClick={handleBurger}>{t("properties")}</Link>
                        <Link className={s.link} to={"/Services"} onClick={handleBurger}>{t("services")}</Link>
                        <Link className={s.link} to={"/ContactUs"} onClick={handleBurger}>{t("contactUs")}</Link>
                    </div>

                    <div className={s.divider} />

                    <div className={s.langRow}>
                        {LANGUAGES.map(lng => (
                            <button
                                key={lng.code}
                                className={i18n.language === lng.code ? `${s.langBtn} ${s.langActive}` : s.langBtn}
                                onClick={() => changeLanguage(lng.code)}
                            >
                                {lng.label}
                            </button>
                        ))}
                    </div>

                    <div className={s.actions}>
                        <button className={s.actionBtn} onClick={toggleCurrency}>
                            <Coins size={18} /> {currency}
                        </button>
                        <button className={s.actionBtn} onClick={handleDark}>
                            {isDark ? <Sun size={18} /> : <Moon size={18} />} {t("toggleTheme")}
                        </button>
                    </div>

                    {user ? (
                        <div className={s.actions}>
                            <Link className={s.actionBtn} to="/add-property" onClick={handleBurger}>
                                <PlusSquare size={18} /> {t("addListing")}
                            </Link>
                            <Link className={s.actionBtn} to="/my-listings" onClick={handleBurger}>
                                <ListChecks size={18} /> {t("myListings")}
                            </Link>
                            <Link className={s.actionBtn} to="/favorites" onClick={handleBurger}>
                                <Heart size={18} /> {t("favorites")}
                            </Link>
                            <Link className={s.profileRow} to="/profile" onClick={handleBurger}>
                                <div className={s.avatar}>
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="avatar" />
                                    ) : (
                                        <span>{profile?.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}</span>
                                    )}
                                </div>
                                <span>{profile?.name || user.email}</span>
                            </Link>
                            <button className={s.logoutBtn} onClick={handleLogout}>
                                <LogOut size={18} /> {t("logout")}
                            </button>
                        </div>
                    ) : (
                        <Link className={s.loginBtn} to="/login" onClick={handleBurger}>
                            {t("login")}
                        </Link>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Burger;
