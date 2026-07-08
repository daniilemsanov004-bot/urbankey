import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { MyContext } from "../Context";
import { useTranslation } from "react-i18next";
import { Home, Search, Heart, User, Menu } from "lucide-react";
import s from "./BottomNav.module.css";

const BottomNav = () => {
    const { user, profile, handleBurger } = useContext(MyContext);
    const { t } = useTranslation();

    return (
        <nav className={s.bar}>
            <NavLink to="/" end className={({ isActive }) => isActive ? `${s.item} ${s.active}` : s.item}>
                <Home size={22} />
                <span>{t("home")}</span>
            </NavLink>

            <NavLink to="/Properties" className={({ isActive }) => isActive ? `${s.item} ${s.active}` : s.item}>
                <Search size={22} />
                <span>{t("properties")}</span>
            </NavLink>

            <NavLink to="/favorites" className={({ isActive }) => isActive ? `${s.item} ${s.active}` : s.item}>
                <Heart size={22} />
                <span>{t("favorites")}</span>
            </NavLink>

            <NavLink to={user ? "/profile" : "/login"} className={({ isActive }) => isActive ? `${s.item} ${s.active}` : s.item}>
                {user && profile?.avatar_url ? (
                    <img className={s.avatar} src={profile.avatar_url} alt="" />
                ) : (
                    <User size={22} />
                )}
                <span>{user ? t("myProfile") : t("login")}</span>
            </NavLink>

            <button className={s.item} onClick={handleBurger}>
                <Menu size={22} />
                <span>{t("menu")}</span>
            </button>
        </nav>
    );
};

export default BottomNav;
