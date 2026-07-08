import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { MyContext } from "../Context";
import s from "./MyListings.module.css";

const MyListings = () => {

    const { user, getMyListings, deleteCard, deleteCommercial } = useContext(MyContext);
    const { t, i18n } = useTranslation();

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    const lang = i18n?.language || "ru";

    const load = async () => {
        setLoading(true);
        const data = await getMyListings();
        setListings(data);
        setLoading(false);
    };

    useEffect(() => {
        if (user) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleDelete = async (item) => {

        if (!window.confirm(t("deleteListingConfirm"))) return;

        const ok = item.kind === "commercial"
            ? await deleteCommercial(item.id)
            : await deleteCard(item.id);

        if (ok) {
            setListings((prev) =>
                prev.filter((l) => !(l.id === item.id && l.kind === item.kind))
            );
        }

    };

    if (!user) {
        return (
            <main className={s.wrap}>
                <p className={s.note}>{t("loginRequired")}</p>
            </main>
        );
    }

    return (
        <main className={s.wrap}>

            <div className={s.header}>
                <h1>{t("myListings")}</h1>
                <Link to="/add-property" className={s.addBtn}>
                    {t("addListing")}
                </Link>
            </div>

            {loading && <p className={s.note}>{t("loading")}</p>}

            {!loading && listings.length === 0 && (
                <p className={s.note}>{t("noMyListings")}</p>
            )}

            <div className={s.grid}>
                {listings.map((item) => {

                    const linkTo = item.kind === "commercial"
                        ? `/commercial/${item.id}`
                        : `/property/${item.id}`;

                    const kindLabel = item.kind === "commercial"
                        ? t("myListingsKindCommercial")
                        : t("myListingsKindResidential");

                    return (
                        <div key={`${item.kind}-${item.id}`} className={s.card}>

                            <Link to={linkTo}>
                                <img
                                    src={item.image}
                                    alt={item[`title_${lang}`] || item.title_ru}
                                    className={s.image}
                                    loading="lazy"
                                />
                            </Link>

                            <div className={s.cardBody}>
                                <span className={s.kindBadge}>{kindLabel}</span>
                                <span className={s.title}>
                                    {item[`title_${lang}`] || item.title_ru}
                                </span>
                                <span className={s.price}>{item.price}</span>
                            </div>

                            <Link
                                to={`/add-property/${item.kind}/${item.id}`}
                                className={s.editBtn}
                            >
                                {t("edit")}
                            </Link>

                            <button
                                className={s.deleteBtn}
                                onClick={() => handleDelete(item)}
                            >
                                <Trash2 size={16} />
                            </button>

                        </div>
                    );

                })}
            </div>

        </main>
    );

};

export default MyListings;
