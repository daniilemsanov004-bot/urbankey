import { NavLink, Link } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "../Context";
import { useCurrency } from "../context/CurrencyContext";
import { useTranslation } from "react-i18next";
import { Home, Search, PlusSquare, Heart, User, Menu, ListChecks, Sun, Moon, LogOut } from "lucide-react";
import s from "./BottomNav.module.css";

const LANGUAGES = [
    { code: "ru", label: "Рус" },
    { code: "uz", label: "O'z" },
    { code: "en", label: "Eng" }
];

const BottomNav = () => {
    const { user, profile, handleBurger, handleDark, isDark, logout, getMyListings } = useContext(MyContext);
    const { currency, toggleCurrency } = useCurrency();
    const { t, i18n } = useTranslation();

    const [show, setShow] = useState(true);
    const lastScroll = useRef(0);

    const [hasListings, setHasListings] = useState(false);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const pressTimer = useRef(null);
    const longPressed = useRef(false);

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            setShow(y < lastScroll.current || y < 80);
            lastScroll.current = y;
        };
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        let cancelled = false;
        if (user) {
            getMyListings().then(data => {
                if (!cancelled) setHasListings(Array.isArray(data) && data.length > 0);
            }).catch(() => {});
        } else {
            setHasListings(false);
        }
        return () => { cancelled = true; };
    }, [user, getMyListings]);

    const startPress = () => {
        longPressed.current = false;
        pressTimer.current = setTimeout(() => {
            longPressed.current = true;
            setDrawerOpen(true);
        }, 480);
    };

    const cancelPress = () => clearTimeout(pressTimer.current);

    const handleProfileClick = (e) => {
        if (longPressed.current) e.preventDefault();
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        localStorage.setItem("language", lng);
    };

    const handleLogout = async () => {
        setDrawerOpen(false);
        await logout();
    };

    return (
        <>
            <nav className={`${s.bar} ${show ? "" : s.hidden}`} aria-label={t("menu")}>
                <NavLink to="/" end className={({ isActive }) => isActive ? `${s.item} ${s.active}` : s.item}>
                    <Home size={21} />
                    <span>{t("home")}</span>
                </NavLink>

                <NavLink to="/Properties" className={({ isActive }) => isActive ? `${s.item} ${s.active}` : s.item}>
                    <Search size={21} />
                    <span>{t("properties")}</span>
                </NavLink>

                {user && (
                    <NavLink to="/add-property" className={({ isActive }) => isActive ? `${s.item} ${s.addItem} ${s.active}` : `${s.item} ${s.addItem}`}>
                        <PlusSquare size={22} />
                        <span>{t("addListing")}</span>
                    </NavLink>
                )}

                <NavLink to="/favorites" className={({ isActive }) => isActive ? `${s.item} ${s.active}` : s.item}>
                    <Heart size={21} />
                    <span>{t("favorites")}</span>
                </NavLink>

                <Link
                    to={user ? "/profile" : "/login"}
                    className={user ? s.item : `${s.item} ${s.guestPulse}`}
                    onClick={handleProfileClick}
                    onTouchStart={startPress}
                    onTouchEnd={cancelPress}
                    onMouseDown={startPress}
                    onMouseUp={cancelPress}
                    onMouseLeave={cancelPress}
                >
                    {user && profile?.avatar_url ? (
                        <img className={s.avatar} src={profile.avatar_url} alt="" />
                    ) : (
                        <User size={21} />
                    )}
                    <span>{user ? t("myProfile") : t("login")}</span>
                </Link>

                {user && hasListings ? (
                    <NavLink to="/my-listings" className={({ isActive }) => isActive ? `${s.item} ${s.active}` : s.item}>
                        <ListChecks size={21} />
                        <span>{t("myListings")}</span>
                    </NavLink>
                ) : (
                    <button className={s.item} onClick={handleBurger}>
                        <Menu size={21} />
                        <span>{t("menu")}</span>
                    </button>
                )}
            </nav>

            {/* Drawer по долгому тапу на профиль/аватар — язык, валюта, тема,
                выход, плюс страницы, которых нет на панели (О компании,
                Сервисы, Контакты), чтобы они не терялись, когда последняя
                вкладка занята "Моими объявлениями" */}
            <div className={drawerOpen ? `${s.drawerOverlay} ${s.drawerOpen}` : s.drawerOverlay} onClick={() => setDrawerOpen(false)}>
                <div className={s.drawer} onClick={(e) => e.stopPropagation()}>
                    <div className={s.drawerHandle} />

                    <div className={s.drawerLinks}>
                        <Link to="/AboutUs" className={s.drawerLink} onClick={() => setDrawerOpen(false)}>{t("aboutUs")}</Link>
                        <Link to="/Services" className={s.drawerLink} onClick={() => setDrawerOpen(false)}>{t("services")}</Link>
                        <Link to="/ContactUs" className={s.drawerLink} onClick={() => setDrawerOpen(false)}>{t("contactUs")}</Link>
                    </div>

                    <div className={s.drawerRow}>
                        {LANGUAGES.map(lng => (
                            <button
                                key={lng.code}
                                className={i18n.language === lng.code ? `${s.drawerChip} ${s.drawerChipActive}` : s.drawerChip}
                                onClick={() => changeLanguage(lng.code)}
                            >
                                {lng.label}
                            </button>
                        ))}
                    </div>

                    <div className={s.drawerRow}>
                        <button className={s.drawerAction} onClick={toggleCurrency}>
                            {currency} · {t("switchCurrency")}
                        </button>
                        <button className={s.drawerAction} onClick={handleDark}>
                            {isDark ? <Sun size={16} /> : <Moon size={16} />} {t("toggleTheme")}
                        </button>
                    </div>

                    {user && (
                        <button className={s.drawerLogout} onClick={handleLogout}>
                            <LogOut size={16} /> {t("logout")}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default BottomNav;
