import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, Send, Loader2, MessageSquarePlus } from "lucide-react";
import { supabase } from "../supabase";
import { MyContext } from "../Context";
import s from "./ReviewForm.module.css";

export default function ReviewForm({ onAdd }) {
    const { user } = useContext(MyContext);
    const { t } = useTranslation();

    const [text, setText] = useState("");
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [loading, setLoading] = useState(false);

    async function sendReview() {
        if (!user) {
            alert(t("reviewForm.needLogin"));
            return;
        }

        if (!text.trim()) return;

        setLoading(true);

        const { data, error } = await supabase
            .from("reviews")
            .insert({
                user_id: user.id,
                rating,
                text
            })
            .select()
            .single();

        setLoading(false);

        if (error) {
            console.error(error);
            alert(error.message);
            return;
        }

        setText("");
        setRating(5);

        if (onAdd) onAdd(data);
    }

    return (
        <div className={s.form}>
            <div className={s.formHeader}>
                <div className={s.formIcon}>
                    <MessageSquarePlus size={22} />
                </div>

                <div>
                    <h3>{t("reviewForm.title")}</h3>
                    <p>{t("reviewForm.subtitle")}</p>
                </div>
            </div>

            <div className={s.ratingBox}>
                <p>{t("reviewForm.ratingLabel")}</p>

                <div
                    className={s.stars}
                    onMouseLeave={() => setHoverRating(0)}
                >
                    {[1, 2, 3, 4, 5].map(i => (
                        <button
                            key={i}
                            type="button"
                            className={
                                i <= (hoverRating || rating)
                                    ? s.activeStar
                                    : s.star
                            }
                            onMouseEnter={() => setHoverRating(i)}
                            onClick={() => setRating(i)}
                            aria-label={t("reviewForm.starAria", { count: i })}
                        >
                            <Star
                                size={26}
                                fill={
                                    i <= (hoverRating || rating)
                                        ? "currentColor"
                                        : "transparent"
                                }
                            />
                        </button>
                    ))}
                </div>
            </div>

            <textarea
                className={s.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("reviewForm.placeholder")}
            />

            <button
                className={s.send}
                onClick={sendReview}
                disabled={loading}
            >
                {loading ? (
                    <>
                        <Loader2 size={18} className={s.spinner} />
                        {t("reviewForm.sending")}
                    </>
                ) : (
                    <>
                        <Send size={18} />
                        {t("reviewForm.send")}
                    </>
                )}
            </button>
        </div>
    );
}