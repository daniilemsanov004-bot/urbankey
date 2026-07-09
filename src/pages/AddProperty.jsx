import { useContext, useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X, Star, ImagePlus, Languages, RefreshCw } from "lucide-react";
import { MyContext } from "../Context";
import { translateFields, pickLangValue, SUPPORTED_LISTING_LANGS } from "../utils/autoTranslate";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import s from "./AddProperty.module.css";

const FIELDS_BY_KIND = {
    residential: ["title", "description", "type", "about", "location"],
    commercial: ["title", "description", "district", "address", "propertyClass", "landmark", "status"]
};

const emptyLang = () => ({ ru: "", en: "", uz: "" });

const AddProperty = () => {

    const { user, profile, uploadImage, createUserProperty, updateUserProperty, getMyListingFull, getMyListings } = useContext(MyContext);
    const { t, i18n } = useTranslation();
    const { isOnline } = useOnlineStatus();
    const navigate = useNavigate();
    const { kind: kindParam, id } = useParams();

    const isEditing = Boolean(id);

    const FREE_LISTING_LIMIT = 7;
    const [activeCount, setActiveCount] = useState(null);

    const isAdmin = profile?.role === "admin";

    useEffect(() => {
        if (isEditing || !user || isAdmin) return;
        let cancelled = false;
        getMyListings().then((data) => {
            if (!cancelled) setActiveCount(Array.isArray(data) ? data.length : 0);
        }).catch(() => { if (!cancelled) setActiveCount(0); });
        return () => { cancelled = true; };
    }, [isEditing, user, isAdmin, getMyListings]);

    const limitReached = !isAdmin && !isEditing && activeCount !== null && activeCount >= FREE_LISTING_LIMIT;

    const { register, handleSubmit, reset } = useForm();

    const [kind, setKind] = useState(kindParam === "commercial" ? "commercial" : "residential");

    const [sourceLang, setSourceLang] = useState(
        SUPPORTED_LISTING_LANGS.includes(i18n?.language) ? i18n.language : "ru"
    );

    const [manualMode, setManualMode] = useState(false);
    const [retranslating, setRetranslating] = useState({});

    const [langData, setLangData] = useState(() => {
        const initial = {};
        [...FIELDS_BY_KIND.residential, ...FIELDS_BY_KIND.commercial].forEach((f) => {
            initial[f] = emptyLang();
        });
        return initial;
    });

    const setFieldLang = (field, lang, value) => {
        setLangData((prev) => ({ ...prev, [field]: { ...prev[field], [lang]: value } }));
    };

    const [amenities, setAmenities] = useState([]);
    const [amenityInput, setAmenityInput] = useState("");

    const [photos, setPhotos] = useState([]);
    const fileInputRef = useRef(null);

    const [submitting, setSubmitting] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [photosError, setPhotosError] = useState(false);
    const [loadingListing, setLoadingListing] = useState(isEditing);

    useEffect(() => {

        if (!isEditing || !user) return;

        (async () => {

            setLoadingListing(true);

            const record = await getMyListingFull(kindParam, id);

            if (!record) {
                setLoadingListing(false);
                navigate("/my-listings");
                return;
            }

            setKind(kindParam === "commercial" ? "commercial" : "residential");

            const nextLangData = {};
            const fields = FIELDS_BY_KIND[kindParam === "commercial" ? "commercial" : "residential"];

            fields.forEach((field) => {
                const column = field === "propertyClass" ? "class" : field;
                nextLangData[field] = {
                    ru: record[`${column}_ru`] || "",
                    en: record[`${column}_en`] || "",
                    uz: record[`${column}_uz`] || ""
                };
            });

            setLangData((prev) => ({ ...prev, ...nextLangData }));

            const guessLang = ["ru", "en", "uz"].find((l) => nextLangData.title?.[l]) || "ru";
            setSourceLang(guessLang);

            reset({
                bedrooms: record.bedrooms_ru || record.bedrooms || "",
                bathrooms: record.bathrooms_ru || record.bathrooms || "",
                year: record.year || "",
                square: record.square || "",
                price: record.price || "",
                floor: record.floor || "",
                ceiling: record.ceiling || record.ceiling_height || "",
                area: record.area || "",
                deliveryDate: record.delivery_date || "",
                ownerPhone: record.owner_phone || "",
                ownerTelegram: record.owner_telegram || ""
            });

            const existingImages = record.images && record.images.length
                ? record.images
                : (record.image ? [record.image] : []);

            setPhotos(existingImages.map((url) => ({ existingUrl: url, previewUrl: url })));

            const existingAmenities = (record.amenities || []).map(
                (a) => (typeof a === "string" ? a : (a.ru || a.en || a.uz || ""))
            );
            setAmenities(existingAmenities.filter(Boolean));

            setLoadingListing(false);

        })();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing, user, kindParam, id]);

    useEffect(() => {
        return () => {
            photos.forEach((p) => {
                if (!p.existingUrl) URL.revokeObjectURL(p.previewUrl);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addAmenity = () => {
        const value = amenityInput.trim();
        if (!value) return;
        setAmenities((prev) => [...prev, value]);
        setAmenityInput("");
    };

    const removeAmenity = (index) => {
        setAmenities((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePhotosChange = (e) => {

        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const next = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));

        setPhotos((prev) => [...prev, ...next]);
        setPhotosError(false);

        e.target.value = "";

    };

    const removePhoto = (index) => {
        setPhotos((prev) => {
            const removed = prev[index];
            if (removed && !removed.existingUrl) URL.revokeObjectURL(removed.previewUrl);
            return prev.filter((_, i) => i !== index);
        });
    };

    const makeCover = (index) => {
        setPhotos((prev) => {
            if (index === 0) return prev;
            const next = [...prev];
            const [item] = next.splice(index, 1);
            next.unshift(item);
            return next;
        });
    };

    const retranslateField = async (field) => {

        const text = langData[field]?.[sourceLang];
        if (!text || !text.trim()) return;

        setRetranslating((prev) => ({ ...prev, [field]: true }));

        const result = await translateFields(sourceLang, { [field]: text });
        const value = pickLangValue(result, field, text);

        setLangData((prev) => ({ ...prev, [field]: value }));

        setRetranslating((prev) => ({ ...prev, [field]: false }));

    };

    const activeFields = FIELDS_BY_KIND[kind];

    const onSubmit = async (data) => {

        if (limitReached) {
            return;
        }

        if (!photos.length) {
            setPhotosError(true);
            return;
        }

        setSubmitting(true);

        const uploadedUrls = [];

        for (const p of photos) {

            if (p.existingUrl) {
                uploadedUrls.push(p.existingUrl);
                continue;
            }

            const url = await uploadImage(p.file);
            if (!url) {
                setSubmitting(false);
                return;
            }
            uploadedUrls.push(url);

        }

        let finalLangData = langData;

        if (!manualMode) {

            const textFields = {};
            activeFields.forEach((f) => { textFields[f] = langData[f][sourceLang]; });

            setTranslating(true);
            const translated = await translateFields(sourceLang, textFields);
            setTranslating(false);

            const next = { ...langData };
            activeFields.forEach((f) => {
                next[f] = pickLangValue(translated, f, langData[f][sourceLang]);
            });
            finalLangData = next;
            setLangData(next);

        }

        const lang = (field) => {
            const v = finalLangData[field];
            const fallback = v[sourceLang] || v.ru || v.en || v.uz || "";
            return { ru: v.ru || fallback, en: v.en || fallback, uz: v.uz || fallback };
        };

        setTranslating(true);
        const amenitiesTranslated = await translateFields(
            sourceLang,
            Object.fromEntries(amenities.map((value, i) => [`amenity_${i}`, value]))
        );
        setTranslating(false);

        const amenitiesPayload = amenities.map((value, i) =>
            pickLangValue(amenitiesTranslated, `amenity_${i}`, value)
        );

        const commonContacts = { ownerPhone: data.ownerPhone, ownerTelegram: data.ownerTelegram };

        let payload;

        if (kind === "commercial") {
            payload = {
                title: lang("title"),
                description: lang("description"),
                district: lang("district"),
                address: lang("address"),
                class: lang("propertyClass"),
                landmark: lang("landmark"),
                status: lang("status"),
                floor: data.floor,
                ceiling: data.ceiling,
                area: data.area,
                price: data.price,
                deliveryDate: data.deliveryDate,
                image: uploadedUrls[0],
                images: uploadedUrls,
                amenities: amenitiesPayload,
                ...commonContacts
            };
        } else {
            payload = {
                title: lang("title"),
                description: lang("description"),
                about: lang("about"),
                location: lang("location"),
                type: lang("type"),
                bedrooms: data.bedrooms,
                bathrooms: data.bathrooms,
                year: data.year,
                square: data.square,
                price: data.price,
                image: uploadedUrls[0],
                images: uploadedUrls,
                amenities: amenitiesPayload,
                ...commonContacts
            };
        }

        const ok = isEditing
            ? await updateUserProperty(kind, id, payload)
            : await createUserProperty(kind, payload);

        setSubmitting(false);

        if (ok) navigate("/my-listings");

    };

    if (!user) {
        return (
            <main className={s.wrap}>
                <p className={s.loginNote}>{t("loginRequired")}</p>
            </main>
        );
    }

    if (loadingListing) {
        return (
            <main className={s.wrap}>
                <p className={s.loadingNote}>{t("listingLoadingListing")}</p>
            </main>
        );
    }

    if (limitReached) {
        return (
            <main className={s.wrap}>
                <div className={s.limitCard}>
                    <h1>{t("listingLimitTitle")}</h1>
                    <p className={s.subtitle}>{t("listingLimitDesc", { limit: FREE_LISTING_LIMIT })}</p>
                    <Link className={s.submitBtn} to="/ContactUs">{t("listingLimitCta")}</Link>
                </div>
            </main>
        );
    }

    return (
        <main className={s.wrap}>

            <h1>{isEditing ? t("listingEditFormTitle") : t("listingFormTitle")}</h1>
            <p className={s.subtitle}>{t("listingFormSubtitle")}</p>

            {!isEditing && (
                <div className={s.kindToggle}>
                    <button type="button" className={kind === "residential" ? s.kindActive : s.kindBtn} onClick={() => setKind("residential")}>
                        {t("listingKindResidential")}
                    </button>
                    <button type="button" className={kind === "commercial" ? s.kindActive : s.kindBtn} onClick={() => setKind("commercial")}>
                        {t("listingKindCommercial")}
                    </button>
                </div>
            )}

            <div className={s.langBlock}>
                <span className={s.langLabel}>
                    <Languages size={15} />
                    {t("listingWriteLangLabel")}
                </span>

                <div className={s.langToggle}>
                    {SUPPORTED_LISTING_LANGS.map((l) => (
                        <button key={l} type="button" className={sourceLang === l ? s.langActive : s.langBtn} onClick={() => setSourceLang(l)}>
                            {t(`listingLang_${l}`)}
                        </button>
                    ))}
                </div>

                <p className={s.sectionHint}>{t("listingWriteLangHint")}</p>

                <button type="button" className={manualMode ? s.manualToggleActive : s.manualToggle} onClick={() => setManualMode((v) => !v)}>
                    <Languages size={14} />
                    {manualMode ? t("listingManualModeOn") : t("listingManualModeOff")}
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className={s.form}>

                <section className={s.section}>

                    <h2 className={s.sectionTitle}>{t("listingSectionMain")}</h2>

                    {!manualMode ? (
                        <>
                            <label className={s.label}>
                                {t("listingTitleLabel")}
                                <input className={s.input} value={langData.title[sourceLang]} onChange={(e) => setFieldLang("title", sourceLang, e.target.value)} required />
                            </label>

                            <label className={s.label}>
                                {t("listingDescriptionLabel")}
                                <textarea className={s.textarea} rows={4} value={langData.description[sourceLang]} onChange={(e) => setFieldLang("description", sourceLang, e.target.value)} required />
                            </label>
                        </>
                    ) : (
                        ["title", "description"].map((field) => (
                            <div key={field} className={s.manualField}>
                                <span className={s.manualFieldTitle}>
                                    {field === "title" ? t("listingTitleLabel") : t("listingDescriptionLabel")}
                                </span>

                                {SUPPORTED_LISTING_LANGS.map((l) => (
                                    <div key={l} className={s.manualLangRow}>
                                        <span className={s.manualLangTag}>{l}</span>
                                        {field === "description" ? (
                                            <textarea className={s.textarea} rows={3} value={langData[field][l]} onChange={(e) => setFieldLang(field, l, e.target.value)} />
                                        ) : (
                                            <input className={s.input} value={langData[field][l]} onChange={(e) => setFieldLang(field, l, e.target.value)} />
                                        )}
                                    </div>
                                ))}

                                <button type="button" className={s.retranslateBtn} disabled={retranslating[field]} onClick={() => retranslateField(field)}>
                                    <RefreshCw size={13} />
                                    {t("listingRetranslateFrom", { lang: t(`listingLang_${sourceLang}`) })}
                                </button>
                            </div>
                        ))
                    )}

                </section>

                {kind === "residential" ? (
                    <section className={s.section}>

                        <h2 className={s.sectionTitle}>{t("listingSectionDetails")}</h2>

                        {!manualMode ? (
                            <>
                                <label className={s.label}>
                                    {t("listingTypeLabel")}
                                    <input className={s.input} value={langData.type[sourceLang]} onChange={(e) => setFieldLang("type", sourceLang, e.target.value)} required />
                                </label>

                                <label className={s.label}>
                                    {t("listingAboutLabel")}
                                    <textarea className={s.textarea} rows={4} value={langData.about[sourceLang]} onChange={(e) => setFieldLang("about", sourceLang, e.target.value)} />
                                </label>

                                <label className={s.label}>
                                    {t("listingLocationLabel")}
                                    <input className={s.input} value={langData.location[sourceLang]} onChange={(e) => setFieldLang("location", sourceLang, e.target.value)} required />
                                </label>
                            </>
                        ) : (
                            ["type", "about", "location"].map((field) => (
                                <div key={field} className={s.manualField}>
                                    <span className={s.manualFieldTitle}>{t(`listing${field[0].toUpperCase()}${field.slice(1)}Label`)}</span>

                                    {SUPPORTED_LISTING_LANGS.map((l) => (
                                        <div key={l} className={s.manualLangRow}>
                                            <span className={s.manualLangTag}>{l}</span>
                                            {field === "about" ? (
                                                <textarea className={s.textarea} rows={3} value={langData[field][l]} onChange={(e) => setFieldLang(field, l, e.target.value)} />
                                            ) : (
                                                <input className={s.input} value={langData[field][l]} onChange={(e) => setFieldLang(field, l, e.target.value)} />
                                            )}
                                        </div>
                                    ))}

                                    <button type="button" className={s.retranslateBtn} disabled={retranslating[field]} onClick={() => retranslateField(field)}>
                                        <RefreshCw size={13} />
                                        {t("listingRetranslateFrom", { lang: t(`listingLang_${sourceLang}`) })}
                                    </button>
                                </div>
                            ))
                        )}

                        <div className={s.row}>
                            <label className={s.label}>
                                {t("listingBedroomsLabel")}
                                <input className={s.input} {...register("bedrooms", { required: true })} />
                            </label>

                            <label className={s.label}>
                                {t("listingBathroomsLabel")}
                                <input className={s.input} {...register("bathrooms", { required: true })} />
                            </label>

                            <label className={s.label}>
                                {t("listingYearLabel")}
                                <input type="number" className={s.input} {...register("year")} />
                            </label>

                            <label className={s.label}>
                                {t("listingSquareLabel")}
                                <input type="number" className={s.input} {...register("square")} />
                            </label>
                        </div>

                        <label className={s.label}>
                            {t("listingPriceLabel")}
                            <input type="number" className={s.input} {...register("price", { required: true })} />
                        </label>

                    </section>
                ) : (
                    <section className={s.section}>

                        <h2 className={s.sectionTitle}>{t("listingSectionDetails")}</h2>

                        {!manualMode ? (
                            <>
                                <div className={s.row}>
                                    <label className={s.label}>
                                        {t("listingDistrictLabel")}
                                        <input className={s.input} value={langData.district[sourceLang]} onChange={(e) => setFieldLang("district", sourceLang, e.target.value)} required />
                                    </label>

                                    <label className={s.label}>
                                        {t("listingAddressLabel")}
                                        <input className={s.input} value={langData.address[sourceLang]} onChange={(e) => setFieldLang("address", sourceLang, e.target.value)} required />
                                    </label>
                                </div>

                                <div className={s.row}>
                                    <label className={s.label}>
                                        {t("listingClassLabel")}
                                        <input className={s.input} value={langData.propertyClass[sourceLang]} onChange={(e) => setFieldLang("propertyClass", sourceLang, e.target.value)} />
                                    </label>

                                    <label className={s.label}>
                                        {t("listingLandmarkLabel")}
                                        <input className={s.input} value={langData.landmark[sourceLang]} onChange={(e) => setFieldLang("landmark", sourceLang, e.target.value)} />
                                    </label>

                                    <label className={s.label}>
                                        {t("listingStatusLabel")}
                                        <input className={s.input} value={langData.status[sourceLang]} onChange={(e) => setFieldLang("status", sourceLang, e.target.value)} />
                                    </label>
                                </div>
                            </>
                        ) : (
                            ["district", "address", "propertyClass", "landmark", "status"].map((field) => (
                                <div key={field} className={s.manualField}>
                                    <span className={s.manualFieldTitle}>
                                        {t(`listing${field === "propertyClass" ? "Class" : field[0].toUpperCase() + field.slice(1)}Label`)}
                                    </span>

                                    {SUPPORTED_LISTING_LANGS.map((l) => (
                                        <div key={l} className={s.manualLangRow}>
                                            <span className={s.manualLangTag}>{l}</span>
                                            <input className={s.input} value={langData[field][l]} onChange={(e) => setFieldLang(field, l, e.target.value)} />
                                        </div>
                                    ))}

                                    <button type="button" className={s.retranslateBtn} disabled={retranslating[field]} onClick={() => retranslateField(field)}>
                                        <RefreshCw size={13} />
                                        {t("listingRetranslateFrom", { lang: t(`listingLang_${sourceLang}`) })}
                                    </button>
                                </div>
                            ))
                        )}

                        <div className={s.row}>
                            <label className={s.label}>
                                {t("listingFloorLabel")}
                                <input className={s.input} {...register("floor")} />
                            </label>

                            <label className={s.label}>
                                {t("listingCeilingLabel")}
                                <input className={s.input} {...register("ceiling")} />
                            </label>

                            <label className={s.label}>
                                {t("listingAreaLabel")}
                                <input type="number" className={s.input} {...register("area", { required: true })} />
                            </label>
                        </div>

                        <div className={s.row}>
                            <label className={s.label}>
                                {t("listingPriceLabel")}
                                <input type="number" className={s.input} {...register("price", { required: true })} />
                            </label>

                            <label className={s.label}>
                                {t("listingDeliveryDateLabel")}
                                <input type="date" className={s.input} {...register("deliveryDate")} />
                            </label>
                        </div>

                    </section>
                )}

                <section className={s.section}>

                    <h2 className={s.sectionTitle}>{t("listingSectionAmenities")}</h2>
                    <p className={s.sectionHint}>{t("listingAmenitiesHint")}</p>

                    <div className={s.amenitiesBlock}>

                        <div className={s.amenityInputRow}>
                            <input
                                className={s.input}
                                placeholder={t("listingAmenityPlaceholder")}
                                value={amenityInput}
                                onChange={(e) => setAmenityInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addAmenity();
                                    }
                                }}
                            />
                            <button type="button" className={s.addAmenityBtn} onClick={addAmenity}>
                                {t("listingAddAmenity")}
                            </button>
                        </div>

                        <div className={s.amenityTags}>
                            {amenities.map((a, i) => (
                                <span key={i} className={s.amenityTag}>
                                    {a}
                                    <button type="button" onClick={() => removeAmenity(i)}>
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>

                    </div>

                </section>

                <section className={s.section}>

                    <h2 className={s.sectionTitle}>{t("listingSectionPhotos")}</h2>
                    <p className={s.sectionHint}>{t("listingPhotosHint")}</p>

                    <div className={s.photosGrid}>

                        {photos.map((p, i) => (
                            <div key={p.previewUrl + i} className={s.photoThumb}>
                                <img src={p.previewUrl} alt="" />

                                {i === 0 && (
                                    <span className={s.coverBadge}>
                                        <Star size={12} />
                                        {t("listingCoverBadge")}
                                    </span>
                                )}

                                <div className={s.photoActions}>
                                    {i !== 0 && (
                                        <button type="button" className={s.photoActionBtn} onClick={() => makeCover(i)} title={t("listingMakeCover")}>
                                            <Star size={14} />
                                        </button>
                                    )}
                                    <button type="button" className={s.photoActionBtn} onClick={() => removePhoto(i)} title={t("listingRemovePhoto")}>
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button type="button" className={s.addPhotoBtn} onClick={() => fileInputRef.current?.click()}>
                            <ImagePlus size={20} />
                            {t("listingAddPhotos")}
                        </button>

                    </div>

                    <input ref={fileInputRef} type="file" accept="image/*" multiple className={s.hiddenFileInput} onChange={handlePhotosChange} />

                    {photosError && <span className={s.error}>{t("listingImageRequired")}</span>}

                </section>

                <div className={s.ownerBlock}>

                    <h3>{t("listingOwnerContactsTitle")}</h3>
                    <p className={s.ownerNote}>{t("listingOwnerContactsNote")}</p>

                    <label className={s.label}>
                        {t("listingOwnerPhoneLabel")}
                        <input className={s.input} {...register("ownerPhone", { required: true })} />
                    </label>

                    <label className={s.label}>
                        {t("listingOwnerTelegramLabel")}
                        <input className={s.input} {...register("ownerTelegram")} />
                    </label>

                </div>

                <button type="submit" className={s.submitBtn} disabled={submitting || !isOnline}>
                    {!isOnline ? t("offlineWarning") : translating ? t("listingTranslating") : submitting ? t("sending") : isEditing ? t("listingSaveButton") : t("listingSubmitButton")}
                </button>

            </form>

        </main>
    );

};

export default AddProperty;
