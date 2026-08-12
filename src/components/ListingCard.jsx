import { useState, useRef, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Flame } from "lucide-react";

import s from "./ListingCard.module.css";
import FavoriteButton from "./FavoriteButton";

const readMoreLabels = {
    ru: { more: "Подробнее", less: "Скрыть" },
    en: { more: "Show more", less: "Show less" },
    uz: { more: "Batafsil", less: "Yopish" },
};

// Единая карточка объекта — и для коммерции (CommercialSection.jsx), и
// для жилья (Feautured.jsx). Раньше это были два похожих, но независимых
// куска JSX с расходящимися стилями — теперь один источник правды: любая
// правка дизайна карточки (отступы, скругления, поведение "Подробнее" и
// т.п.) делается тут один раз и применяется сразу везде.
//
// Пропсы специально общие/нейтральные (image, title, meta, tags и т.п.),
// а не "commercial"-специфичные — так компонент одинаково подходит и для
// коммерции, и для жилья, и для любого будущего типа объекта.
const ListingCard = ({
    image,
    badge = false,
    favoriteItem,
    title,
    location,
    meta = [],
    tags = [],
    description,
    price,
    detailsLink,
    detailsLabel,
    isAdmin = false,
    onDelete,
    editLink,
    animation
}) => {

    const { i18n, t } = useTranslation();

    const [expanded, setExpanded] = useState(false);
    const [overflowing, setOverflowing] = useState(false);
    const descRef = useRef(null);

    useLayoutEffect(() => {

        if (!descRef.current) return;

        setOverflowing(
            descRef.current.scrollHeight - descRef.current.clientHeight > 1
        );

    }, [description]);

    const labels = readMoreLabels[i18n.language] || readMoreLabels.ru;

    const Wrapper = animation ? animation.Component : "article";
    const wrapperProps = animation ? animation.props : {};

    return (

        <Wrapper className={s.card} {...wrapperProps}>

            <div className={s.imageBox}>

                <img
                    src={image}
                    className={s.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                />

                {badge && (
                    <div className={s.badge}>
                        <Flame size={16} />
                        Hot
                    </div>
                )}

                {favoriteItem && (
                    <FavoriteButton item={favoriteItem} className={s.heart} />
                )}

            </div>


            <div className={s.content}>

                <h3>{title}</h3>

                {location && (
                    <p className={s.location}>
                        <MapPin size={17} />
                        {location}
                    </p>
                )}

                {meta.length > 0 && (
                    <div className={s.meta}>
                        {meta.map((item, i) => (
                            <span key={i} className={s.metaItem}>
                                {item.icon}
                                {item.label}
                            </span>
                        ))}
                    </div>
                )}

                {tags.length > 0 && (
                    <div className={s.tags}>
                        {tags.map((item, i) => (
                            <span key={i}>
                                {item.icon}
                                {item.label}
                            </span>
                        ))}
                    </div>
                )}

                {description && (
                    <div className={s.descriptionWrap}>

                        <p
                            ref={descRef}
                            className={`${s.desc} ${expanded ? s.expanded : ""}`}
                        >
                            {description}
                        </p>

                        {(overflowing || expanded) && (
                            <button
                                type="button"
                                className={s.readMore}
                                onClick={() => setExpanded(v => !v)}
                            >
                                {expanded ? labels.less : labels.more}
                            </button>
                        )}

                    </div>
                )}

                <div className={s.divider} />

                <div className={s.price}>
                    {price}
                    <Flame size={20} />
                </div>

                <Link to={detailsLink} className={s.moreBtn}>

                    {detailsLabel}

                    <svg className={s.moreBtnArrow} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m13 6 6 6-6 6" />
                    </svg>

                </Link>

                {isAdmin && (
                    <div className={s.adminBtns}>

                        <button className={s.delete} onClick={onDelete}>
                            🗑 {t("delete")}
                        </button>

                        <Link to={editLink} className={s.edit}>
                            ✏ {t("edit")}
                        </Link>

                    </div>
                )}

            </div>

        </Wrapper>
    );
};

export default ListingCard;
