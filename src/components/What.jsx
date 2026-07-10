import s from './What.module.css'

import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { useEffect, useState } from 'react'

import { supabase } from "../supabase"

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay, Mousewheel } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import ReviewForm from "./ReviewForm"
import { useNavigate } from "react-router-dom"
import { useContext } from "react"
import { MyContext } from "../Context"
import {
    Pencil,
    Trash2,
    Star,
    Filter,
    ArrowUpDown,
    MessagesSquare,
    CalendarClock,
    History,
    MapPinned
} from "lucide-react";


const What = () => {

    const [deleteModal, setDeleteModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const { user, profile } = useContext(MyContext)
    const { t, i18n } = useTranslation()
    const [reviews, setReviews] = useState([])
    const [sortBy, setSortBy] = useState("newest");
    const navigate = useNavigate()
    const [filterRating, setFilterRating] = useState(0);
    const [editingReview, setEditingReview] = useState(null);
    const [editText, setEditText] = useState("");
    const [editRating, setEditRating] = useState(5);
    const isAdmin = profile?.role === "admin";
    const myReview = reviews.find(
        review => review.user_id === user?.id
    );
    const averageRating =
        reviews.length > 0
            ? (
                reviews.reduce((sum, review) => sum + review.rating, 0) /
                reviews.length
            ).toFixed(1)
            : 0;
    useEffect(() => {


        async function getReviews() {


            const { data, error } = await supabase
                .from("reviews")
                .select(`
        *,
        profiles (
            id,
            name,
            avatar_url,
            city
        )
    `)
                .order("created_at", { ascending: false });

            if (!error) {
                setReviews(data);
            }

        }


        getReviews()


    }, [])


    async function deleteReview(id) {
        const { error } = await supabase
            .from("reviews")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(error);
            toast.error(error.message);
            return;
        }

        setReviews(prev =>
            prev.filter(review => review.id !== id)
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
    function formatDate(date) {
        if (!date) return "";

        const now = new Date();
        const value = new Date(date);

        const diff = Math.floor((now - value) / 1000);

        if (diff < 60) {
            return t("what.time.now");
        }

        if (diff < 3600) {
            const minutes = Math.floor(diff / 60);
            return t("what.time.minutes", {
                count: minutes
            });
        }

        if (diff < 86400) {
            const hours = Math.floor(diff / 3600);
            return t("what.time.hours", {
                count: hours
            });
        }

        if (diff < 604800) {
            const days = Math.floor(diff / 86400);
            return t("what.time.days", {
                count: days
            });
        }
        return value.toLocaleDateString(
            i18n.language === "ru" ? "ru-RU" : "en-US",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }
    const filteredReviews = [...reviews]
        .filter(review =>
            filterRating === 0
                ? true
                : review.rating === filterRating
        )
        .sort((a, b) => {
            switch (sortBy) {

                case "oldest":
                    return new Date(a.created_at) - new Date(b.created_at);

                case "highest":
                    return b.rating - a.rating;

                case "lowest":
                    return a.rating - b.rating;

                default:
                    return new Date(b.created_at) - new Date(a.created_at);
            }
        });
    return (

        <section className={s.what} id="what">



            <motion.div

                className={s.text}

                initial={{
                    opacity: 0,
                    y: 40
                }}

                whileInView={{
                    opacity: 1,
                    y: 0
                }}

                transition={{
                    duration: 0.8
                }}

                viewport={{
                    amount: 0.2
                }}

            >


                <img
                    src="/Abstract Design.svg"
                    alt=""
                    className={s.logo}
                />


                <h1>
                    {t("what.title")}
                </h1>


                <div className={s.titles}>

                    <p>
                        {t("what.description")}
                    </p>

                </div>


            </motion.div>




            {!myReview ? (
                <ReviewForm
                    user={user}
                    onAdd={(review) => {
                        setReviews(prev => [
                            review,
                            ...prev
                        ]);
                    }}
                />
            ) : (
                <div className={s.reviewExists}>
                    <h3>{t("what.reviewExists.title")}</h3>

                    <p>
                        {t("what.reviewExists.description")}
                    </p>
                </div>
            )}


            <div className={s.topPanel}>

                <div className={s.reviewStats}>

                    <div className={s.statIcon}>
                        <Star size={34} fill="currentColor" />
                    </div>

                    <div className={s.statInfo}>

                        <h2>
                            {averageRating}
                        </h2>

                        <h4>
                            {t("what.stats.title")}
                        </h4>

                        <p>
                            <MessagesSquare size={16} />
                            {reviews.length} {t("what.stats.reviews")}
                        </p>

                    </div>

                </div>

                <div className={s.controls}>

                    <div className={s.filters}>

                        <button
                            className={filterRating === 0 ? s.activeFilter : ""}
                            onClick={() => setFilterRating(0)}
                        >
                            <Filter size={16} />

                            {t("what.filters.all")}
                        </button>

                        {[5, 4, 3, 2, 1].map(star => (

                            <button
                                key={star}
                                className={filterRating === star ? s.activeFilter : ""}
                                onClick={() => setFilterRating(star)}
                            >
                                <Star
                                    size={16}
                                    fill="currentColor"
                                />

                                {star}

                            </button>

                        ))}

                    </div>

                    <div className={s.sortBox}>

                        <ArrowUpDown size={17} />

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >

                            <option value="newest">
                                {t("what.sort.newest")}
                            </option>

                            <option value="oldest">
                                {t("what.sort.oldest")}
                            </option>

                            <option value="highest">
                                {t("what.sort.highest")}
                            </option>

                            <option value="lowest">
                                {t("what.sort.lowest")}
                            </option>

                        </select>

                    </div>

                </div>

            </div>
            <Swiper

                modules={[
                    Navigation,
                    Pagination,
                    Autoplay,
                    Mousewheel
                ]}


                spaceBetween={30}

                slidesPerView={3}

                loop={true}

                navigation={true}


                mousewheel={{
                    forceToAxis: true
                }}


                autoplay={{
                    delay: 6000,
                    disableOnInteraction: false
                }}


                breakpoints={{

                    0: {
                        slidesPerView: 1
                    },

                    768: {
                        slidesPerView: 2
                    },

                    1200: {
                        slidesPerView: 3
                    }

                }}


                className={s.swiper}

            >




                {filteredReviews.map((item, index) => (
                    <SwiperSlide key={item.id}>
                        <motion.div
                            className={s.card}
                            initial={{
                                opacity: 0,
                                y: 120,
                                filter: "blur(10px)"
                            }}
                            whileInView={{
                                opacity: 1,
                                y: 0,
                                filter: "blur(0px)"
                            }}
                            transition={{
                                duration: 0.9,
                                delay: index * 0.1,
                                ease: [0.22, 1, 0.36, 1]
                            }}
                            viewport={{
                                amount: 0.2
                            }}
                            whileHover={{
                                y: -10
                            }}
                        ><>
                                {(user?.id === item.user_id || isAdmin) && (
                                    <div className={s.reviewActions}>

                                        {user?.id === item.user_id && (
                                            <button
                                                className={s.iconBtn}
                                                onClick={() => {
                                                    setEditingReview(item.id);
                                                    setEditText(item.text);
                                                    setEditRating(item.rating);
                                                }}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        )}

                                        <button
                                            className={`${s.iconBtn} ${s.deleteBtn}`}
                                            onClick={() => {
                                                setSelectedReview(item.id);
                                                setDeleteModal(true);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                    </div>
                                )}

                                <div className={s.cardTop}>

                                    <div className={s.rating}>

                                        {[1, 2, 3, 4, 5].map(star => (

                                            <Star
                                                key={star}
                                                size={18}
                                                fill={star <= item.rating ? "currentColor" : "transparent"}
                                                className={
                                                    star <= item.rating
                                                        ? s.starActive
                                                        : s.starInactive
                                                }
                                            />

                                        ))}

                                    </div>

                                </div>

                                {editingReview === item.id ? (

                                    <>

                                        <div className={s.editStars}>

                                            {[1, 2, 3, 4, 5].map(i => (

                                                <button
                                                    key={i}
                                                    type="button"
                                                    className={i <= editRating ? s.activeStar : ""}
                                                    onClick={() => setEditRating(i)}
                                                >
                                                    <Star
                                                        size={20}
                                                        fill="currentColor"
                                                    />
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
                                                {t("what.edit.cancel")}
                                            </button>

                                            <button
                                                onClick={updateReview}
                                            >
                                                {t("what.edit.save")}
                                            </button>

                                        </div>

                                    </>

                                ) : (

                                    <>

                                        <p className={s.reviewText}>
                                            {item.text}
                                        </p>

                                        <div className={s.reviewDates}>

                                            {item.updated_at &&
                                                item.updated_at !== item.created_at && (

                                                    <small className={s.edited}>

                                                        <History size={14} />
                                                        {t("what.edited")} {formatDate(item.updated_at)}

                                                    </small>

                                                )}

                                            <small className={s.created}>

                                                <CalendarClock size={14} />
                                                {t("what.created")} {formatDate(item.created_at)}

                                            </small>

                                        </div>

                                    </>

                                )}

                                <div className={s.user}>

                                    <img
                                        src={
                                            item.profiles?.avatar_url ||
                                            "/Profile.svg"
                                        }
                                        alt={item.profiles?.name}
                                        className={s.imgg}
                                        onClick={() => navigate(`/user/${item.user_id}`)}
                                    />

                                    <div className={s.names}>

                                        <h3>
                                            {item.profiles?.name}
                                        </h3>

                                        <h4>

                                            <MapPinned size={14} />

                                            {item.profiles?.city}

                                        </h4>

                                    </div>

                                </div>
                            </>
                        </motion.div>
                    </SwiperSlide>
                ))}



            </Swiper>



            {
                deleteModal && (
                    <div className={s.modalBg}>
                        <div className={s.modal}>

                            <h3>{t("what.delete.title")}</h3>

                            <p>
                                {t("what.delete.description")}
                            </p>
                            <div className={s.modalBtns}>

                                <button
                                    className={s.cancelBtn}
                                    onClick={() => {
                                        setDeleteModal(false);
                                        setSelectedReview(null);
                                    }}
                                >
                                    {t("what.delete.cancel")}
                                </button>

                                <button
                                    className={s.confirmDeleteBtn}
                                    onClick={async () => {
                                        await deleteReview(selectedReview);
                                        setDeleteModal(false);
                                        setSelectedReview(null);
                                    }}
                                >
                                    {t("what.delete.confirm")}
                                </button>

                            </div>

                        </div>
                    </div>
                )
            }
        </section>

    )


}


export default What