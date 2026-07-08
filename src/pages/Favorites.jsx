import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MyContext } from "../Context";
import { useCurrency } from "../context/CurrencyContext";
import { formatPriceIn } from "../utils/currency";
import FavoriteButton from "../components/FavoriteButton";
import Footer from "../components/Footer";
import s from "./Favorites.module.css";

const Favorites = () => {

    const {
        user,
        favorites,
        favoritesLoading,
        getFavorites
    } = useContext(MyContext);

    const { t } = useTranslation();
    const { currency } = useCurrency();

    useEffect(() => {
        if (user) {
            getFavorites();
        }
    }, [user]);

    if (!user) {
        return (
            <section className={s.wrapper}>
                <div className={s.empty}>
                    <h1>{t("favorites") || "Избранное"}</h1>
                    <p>
                        {t("loginToSeeFavorites")
                            || "Войдите в аккаунт, чтобы видеть сохранённые объекты"}
                    </p>
                    <Link to="/login" className={s.loginBtn}>
                        {t("login") || "Войти"}
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <>
            <section className={s.wrapper}>

                <h1 className={s.title}>
                    {t("favorites") || "Избранное"}
                </h1>

                {favoritesLoading && (
                    <p className={s.status}>{t("loading") || "Загрузка..."}</p>
                )}

                {!favoritesLoading && favorites.length === 0 && (
                    <div className={s.empty}>
                        <p>
                            {t("noFavorites")
                                || "Вы пока ничего не добавили в избранное"}
                        </p>
                        <Link to="/Properties" className={s.loginBtn}>
                            {t("properties") || "Посмотреть объекты"}
                        </Link>
                    </div>
                )}

                <div className={s.grid}>
                    {favorites.map((fav) => (
                        <div className={s.card} key={fav.id}>

                            <FavoriteButton
                                item={{
                                    id: fav.item_id,
                                    type: fav.item_type,
                                    title: fav.title,
                                    image: fav.image,
                                    price: fav.price,
                                    link: fav.link
                                }}
                            />

                            <img
                                src={fav.image}
                                alt={fav.title}
                                className={s.image}
                            />

                            <div className={s.info}>
                                <h3>{fav.title}</h3>
                                <p className={s.price}>{formatPriceIn(fav.price, currency)}</p>

                                <Link to={fav.link} className={s.link}>
                                    {t("viewProperty") || "Открыть объект"}
                                </Link>
                            </div>

                        </div>
                    ))}
                </div>

            </section>

            <Footer />
        </>
    );
};

export default Favorites;
