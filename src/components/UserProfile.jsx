import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase";
import { MyContext } from "../Context";
import s from "./Profile.module.css";
import {
    Pencil,
    Trash2,
    Star,
    Phone,
    MapPinned,
    User as UserIcon,
    CalendarClock
} from "lucide-react";

export default function UserProfile() {
    const { id } = useParams();
    const { user, profile: viewerProfile } = useContext(MyContext);
    const { t, i18n } = useTranslation();

    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [deleteModal, setDeleteModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);

    const [editingReview, setEditingReview] = useState(null);
    const [editText, setEditText] = useState("");
    const [editRating, setEditRating] = useState(5);

    const isAdmin = viewerProfile?.role === "admin";

    useEffect(() => {
        async function loadProfile() {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", id)
                .single();

            if (!error) {
                setProfile(data);
            }

            const { data: reviewsData, error: reviewsError } = await supabase
                .from("reviews")
                .select("*")
                .eq("user_id", id)
                .order("created_at", { ascending: false });

            if (!reviewsError) {
                setReviews(reviewsData);
            }

            setLoading(false);
        }

        loadProfile();
    }, [id]);

    async function deleteReview(reviewId) {
        const { error } = await supabase
            .from("reviews")
            .delete()
            .eq("id", reviewId);

        if (error) {
            console.error(error);
            return;
        }

        setReviews(prev =>
            prev.filter(review => review.id !== reviewId)
        );
    }

    async function updateReview() {
        const { error } = await supabase
            .from("reviews")
            .update({
                text: editText,
                rating: editRating,
                updated_at: new Date().toISOString()
            })
            .eq("id", editingReview);

        if (error) {
            console.error(error);
            return;
        }

        setReviews(prev =>
            prev.map(review =>
                review.id === editingReview
                    ? {
                        ...review,
                        text: editText,
                        rating: editRating,
                        updated_at: new Date().toISOString()
                    }
                    : review
            )
        );

        setEditingReview(null);
        setEditText("");
        setEditRating(5);
    }

    function getLocale() {
        if (i18n.language === "ru") return "ru-RU";
        if (i18n.language === "uz") return "uz-UZ";
        return "en-US";
    }

    if (loading) {
        return (
            <div className={s.loading}>
                {t("profile.loading")}
            </div>
        );
    }

    if (!profile) {
        return (
            <div className={s.loading}>
                {t("profile.notFound")}
            </div>
        );
    }

    const review = reviews[0];

    return (
        <main className={s.profile}>
            <section className={s.profileCard}>

                <div className={s.profileTop}>

                    <div className={s.avatarBlock}>
                        <div className={s.avatar}>
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.name}
                                />
                            ) : (
                                <span>
                                    {(profile.name || "U")[0].toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={s.profileInfo}>
                        <h1 className={s.profileName}>
                            {profile.name} {profile.surname}
                        </h1>

                        <p className={s.email}>
                            <MapPinned size={15} />
                            {profile.city || t("profile.cityUnknown")}
                        </p>
                    </div>

                </div>

                <div className={s.line}></div>

                <div className={s.stats}>

                    <div className={s.stat}>
                        <span>
                            <Phone size={14} />
                            {t("profile.phone")}
                        </span>
                        <b>{profile.phone || t("profile.notSpecified")}</b>
                    </div>

                    <div className={s.stat}>
                        <span>
                            <MapPinned size={14} />
                            {t("profile.city")}
                        </span>
                        <b>{profile.city || t("profile.notSpecified")}</b>
                    </div>

                </div>

                <div className={s.bio}>
                    <span>
                        <UserIcon size={14} />
                        {t("profile.about")}
                    </span>

                    <p>
                        {profile.bio || t("profile.noBio")}
                    </p>
                </div>

                <div className={s.userReviews}>
                    <h2>{t("profile.reviewTitle")}</h2>

                    {!review ? (
                        <div className={s.noReview}>
                            <p>{t("profile.noReview")}</p>
                        </div>
                    ) : (
                        <div className={s.reviewCard}>

                            {(user?.id === review.user_id || isAdmin) && (
                                <div className={s.reviewActions}>
                                    {user?.id === review.user_id && (
                                        <button
                                            className={s.iconBtn}
                                            onClick={() => {
                                                setEditingReview(review.id);
                                                setEditText(review.text);
                                                setEditRating(review.rating);
                                            }}
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    )}

                                    <button
                                        className={`${s.iconBtn} ${s.reviewDeleteBtn}`}
                                        onClick={() => {
                                            setSelectedReview(review.id);
                                            setDeleteModal(true);
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}

                            <div className={s.rating}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star
                                        key={star}
                                        size={18}
                                        fill={star <= review.rating ? "currentColor" : "transparent"}
                                        className={
                                            star <= review.rating
                                                ? s.starActive
                                                : s.starInactive
                                        }
                                    />
                                ))}
                            </div>

                            {editingReview === review.id ? (
                                <>
                                    <div className={s.editStars}>
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <button
                                                key={i}
                                                type="button"
                                                className={i <= editRating ? s.activeStar : ""}
                                                onClick={() => setEditRating(i)}
                                            >
                                                <Star size={20} fill="currentColor" />
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        className={s.editTextarea}
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                    />

                                    <div className={s.editBtns}>
                                        <button
                                            onClick={() => {
                                                setEditingReview(null);
                                                setEditText("");
                                                setEditRating(5);
                                            }}
                                        >
                                            {t("profile.cancel")}
                                        </button>

                                        <button onClick={updateReview}>
                                            {t("profile.save")}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className={s.reviewText}>
                                        {review.text}
                                    </p>

                                    <small className={s.reviewDate}>
                                        <CalendarClock size={14} />
                                        {new Date(review.created_at).toLocaleString(getLocale(), {
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </small>
                                </>
                            )}
                        </div>
                    )}
                </div>

            </section>

            {deleteModal && (
                <div className={s.modalBg}>
                    <div className={s.modal}>

                        <h3>{t("profile.delete.title")}</h3>

                        <p>
                            {t("profile.delete.description")}
                        </p>

                        <div className={s.modalBtns}>

                            <button
                                className={s.cancelBtn}
                                onClick={() => {
                                    setDeleteModal(false);
                                    setSelectedReview(null);
                                }}
                            >
                                {t("profile.delete.cancel")}
                            </button>

                            <button
                                className={s.confirmDeleteBtn}
                                onClick={async () => {
                                    await deleteReview(selectedReview);
                                    setDeleteModal(false);
                                    setSelectedReview(null);
                                }}
                            >
                                {t("profile.delete.confirm")}
                            </button>

                        </div>

                    </div>
                </div>
            )}
        </main>
    );
}