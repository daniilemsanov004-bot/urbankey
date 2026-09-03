import s from "./Nav.module.css";
import { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "../Context";
import { useCurrency } from "../context/CurrencyContext";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { buildLangPath, localizedPath, stripLangPrefix } from "../utils/lang";
import {
    Globe,
    Sun,
    Moon,
    LogOut,
    Menu,
    ShieldCheck,
    Heart,
    Coins,
    PlusSquare,
    ListChecks
} from "lucide-react";

const LANGUAGES = [
    { code: "ru", label: "Рус" },
    { code: "uz", label: "O'z" },
    { code: "en", label: "Eng" }
];

const Nav = () => {

    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { currency, toggleCurrency } = useCurrency();

    const {
        handleBurger,
        handleDark,
        isDark,
        user,
        profile,
        logout
    } = useContext(MyContext);

    const isAdmin = profile?.role === "admin";

    const [isOpen, setIsOpen] = useState(false);
    const [show, setShow] = useState(true);
    const [lastScroll, setLastScroll] = useState(0);

    const langRef = useRef(null);

    useEffect(() => {

        const handleScroll = () => {
            const currentScroll = window.scrollY;

            if (currentScroll > lastScroll && currentScroll > 80) {
                setShow(false);
            } else {
                setShow(true);
            }

            setLastScroll(currentScroll);
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };

    }, [lastScroll]);

    useEffect(() => {

        function handleClickOutside(e) {
            if (langRef.current && !langRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };

    }, []);

    const handleLogout = async () => {
        const success = await logout();
        if (!success) return;
        navigate("/", { replace: true });
    };

    const changeLanguage = (lng) => {
        localStorage.setItem("language", lng);
        setIsOpen(false);
        navigate(buildLangPath(location.pathname, lng) + location.search, { replace: true });
    };

    const currentLang =
        LANGUAGES.find(l => l.code === i18n.language)?.label
        || LANGUAGES[0].label;

    const isOnHome = stripLangPrefix(location.pathname) === "" || stripLangPrefix(location.pathname) === "/";

    const handleHomeClick = (e) => {
        if (isOnHome) {
            e.preventDefault();
            window.location.reload();
        }
    };

    return (
        <nav className={`${s.nav} ${show ? s.active : s.hidden}`}>
            <div className={s.block}>

                <NavLink
                    className={s.logoLink}
                    to={localizedPath("/", i18n.language)}
                    onClick={handleHomeClick}
                >
                    <img
                        className={s.logo}
                        src="/image (16).webp"
                        alt="UrbanKey"
                    />
                </NavLink>

                <div className={s.links}>

                    <NavLink
                        className={({ isActive }) =>
                            isActive ? `${s.link} ${s.activeLink}` : s.link
                        }
                        to={localizedPath("/", i18n.language)}
                        onClick={handleHomeClick}

                        end
                    >
                        {t("home")}
                    </NavLink>

                    <NavLink
                        className={({ isActive }) =>
                            isActive ? `${s.link} ${s.activeLink}` : s.link
                        }
                        to={localizedPath("/AboutUs", i18n.language)}
                    >
                        {t("aboutUs")}
                    </NavLink>

                    <NavLink
                        className={({ isActive }) =>
                            isActive ? `${s.link} ${s.activeLink}` : s.link
                        }
                        to={localizedPath("/Properties", i18n.language)}
                    >
                        {t("properties")}
                    </NavLink>

                    <NavLink
                        className={({ isActive }) =>
                            isActive ? `${s.link} ${s.activeLink}` : s.link
                        }
                        to={localizedPath("/Services", i18n.language)}
                    >
                        {t("services")}
                    </NavLink>

                </div>

                <div className={s.right}>

                    <NavLink to={localizedPath("/ContactUs", i18n.language)} className={s.ctaBtn}>
                        {t("contactUs")}
                    </NavLink>

                    <div className={s.languageWrapper} ref={langRef}>

                        <button
                            className={s.iconBtn}
                            onClick={() => setIsOpen(!isOpen)}
                            aria-label={t("language")}
                        >
                            <Globe size={18} />
                            <span className={s.langCode}>{currentLang}</span>
                        </button>

                        <div className={`${s.languageMenu} ${isOpen ? s.open : ""}`}>
                            {LANGUAGES.map(lng => (
                                <button
                                    key={lng.code}
                                    className={
                                        i18n.language === lng.code
                                            ? s.langActive
                                            : ""
                                    }
                                    onClick={() => changeLanguage(lng.code)}
                                >
                                    {lng.label}
                                </button>
                            ))}
                        </div>

                    </div>

                    <button
                        className={s.iconBtn}
                        onClick={toggleCurrency}
                        aria-label={t("switchCurrency") || "Switch currency"}
                    >
                        <Coins size={18} />
                        <span className={s.currencyCode}>{currency}</span>
                    </button>

                    <button
                        className={s.iconBtn}
                        onClick={handleDark}
                        aria-label={t("toggleTheme")}
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    {user ? (
                        <>
                            <NavLink
                                to="/add-property"
                                className={({ isActive }) =>
                                    isActive ? `${s.iconBtn} ${s.favActive}` : s.iconBtn
                                }
                                aria-label={t("addListing")}
                                title={t("addListing")}
                            >
                                <PlusSquare size={18} />
                            </NavLink>
                            <NavLink
                                to="/my-listings"
                                className={({ isActive }) =>
                                    isActive ? `${s.iconBtn} ${s.favActive}` : s.iconBtn
                                }
                                aria-label={t("myListings")}
                                title={t("myListings")}
                            >
                                <ListChecks size={18} />
                            </NavLink>
                            <NavLink
                                to="/favorites"
                                className={({ isActive }) =>
                                    isActive ? `${s.iconBtn} ${s.favActive}` : s.iconBtn
                                }
                                aria-label={t("favorites") || "Избранное"}
                            >
                                {({ isActive }) => (
                                    <Heart size={18} fill={isActive ? "currentColor" : "none"} />
                                )}
                            </NavLink>
                            <NavLink to="/profile" className={s.user}>
                                <div className={s.navAvatar}>
                                    {profile?.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt="avatar"
                                        />
                                    ) : (
                                        <span>
                                            {profile?.name?.[0]?.toUpperCase()
                                                || user.email[0].toUpperCase()}
                                        </span>
                                    )}
                                    {isAdmin && (
                                        <span className={s.adminDot}>
                                            <ShieldCheck size={11} />
                                        </span>
                                    )}
                                </div>
                            </NavLink>

                            <button
                                className={s.logoutBtn}
                                onClick={handleLogout}
                                aria-label={t("logout")}
                            >
                                <LogOut size={18} />
                            </button>
                        </>
                    ) : (
                        <NavLink to="/login" className={s.ctaBtnOutline}>
                            {t("login")}
                        </NavLink>
                    )}

                </div>

                <button
                    className={s.menuBtn}
                    onClick={handleBurger}
                    aria-label={t("menu")}
                >
                    <Menu size={26} />
                </button>

            </div>
        </nav>
    );
};

export default Nav;