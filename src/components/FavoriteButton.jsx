import { useContext } from "react";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MyContext } from "../Context";
import s from "./FavoriteButton.module.css";

const FavoriteButton = ({ item, className = "" }) => {

    const { isFavorite, toggleFavorite } = useContext(MyContext);
    const { t } = useTranslation();

    const active = isFavorite(item.id, item.type);

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(item);
    };

    return (
        <button
            type="button"
            className={`${s.favBtn} ${active ? s.active : ""} ${className}`}
            onClick={handleClick}
            aria-label={active ? t("removeFromFavorites") : t("addToFavorites")}
        >
            <Heart
                size={20}
                fill={active ? "currentColor" : "none"}
            />
        </button>
    );
};

export default FavoriteButton;
