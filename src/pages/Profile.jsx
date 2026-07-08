import { useContext, useState, useEffect } from "react";
import { MyContext } from "../Context";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase";
import s from "./Profile.module.css";
import { toast } from "react-toastify";
import { LogOut } from "lucide-react";
import {
    Camera,
    Eye,
    EyeOff,
    X,
    Trash2
} from "lucide-react";

export default function Profile() {


    const {
        user,
        profile,
        authLoading,
        logout,
        updateProfile
    } = useContext(MyContext);


    const { t } = useTranslation();

    const [passwordEdit, setPasswordEdit] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState({
        newPassword: "",
        confirm: ""
    });
    const [saving, setSaving] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [edit, setEdit] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteText, setDeleteText] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [logoutModal, setLogoutModal] = useState(false);

    const [form, setForm] = useState({
        name: "",
        surname: "",
        phone: "",
        city: "",
        bio: ""
    });


    const changePassword = async () => {


        if (password.newPassword.length < 6) {

            toast.error(
                t("passwordMin")
            );

            return;

        }


        if (password.newPassword !== password.confirm) {

            toast.error(
                t("passwordMismatch")
            );

            return;

        }


        const { error } =
            await supabase.auth.updateUser({

                password: password.newPassword

            });


        if (error) {

            console.error(error);

            toast.error(
                t("passwordError")
            );

            return;

        }


        toast.success(
            t("passwordChanged")
        );


        setPassword({

            newPassword: "",
            confirm: ""

        });


        setPasswordEdit(false);

    };
    const deleteAccount = async () => {


        if (deleteText !== "DELETE") {
            toast.error(
                t("deleteType")
            );
            return;
        }


        setDeleteLoading(true);


        const {
            data: sessionData
        } = await supabase.auth.getSession();


        const token =
            sessionData.session?.access_token;


        const res =
            await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );


        if (!res.ok) {

            console.error(
                await res.text()
            );


            toast.error(
                t("deleteError")
            );


            setDeleteLoading(false);

            return;
        }


        toast.success(
            t("deleteSuccess")
        );


        await supabase.auth.signOut();

    };
    useEffect(() => {

        if (profile) {

            setForm({

                name: profile.name || "",
                surname: profile.surname || "",
                phone: profile.phone || "",
                city: profile.city || "",
                bio: profile.bio || ""

            });

        }

    }, [profile]);


    const change = (e) => {

        setForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));

    };


    const uploadAvatar = async (e) => {


        const file = e.target.files[0];

        if (!file) return;


        if (!file.type.startsWith("image/")) {

            toast.error(
                t("onlyImages")
            );

            return;

        }


        const preview =
            URL.createObjectURL(file);


        setAvatarPreview(preview);


        setAvatarLoading(true);


        const ext =
            file.name.split(".").pop();


        const fileName =
            `${user.id}-${Date.now()}.${ext}`;


        const { error } =
            await supabase.storage
                .from("images")
                .upload(
                    fileName,
                    file
                );


        if (error) {

            toast.error(
                t("avatarError")
            );

            setAvatarLoading(false);

            return;

        }


        const { data } =
            supabase.storage
                .from("images")
                .getPublicUrl(
                    fileName
                );


        const updated =
            await updateProfile({

                avatar_url: data.publicUrl

            });


        if (updated) {

            toast.success(
                t("avatarUpdated")
            );

        }


        setAvatarLoading(false);

    };


    const saveProfile = async () => {

        if (!profile?.id) return;


        setSaving(true);


        const updated =
            await updateProfile({

                name: form.name,
                surname: form.surname,
                phone: form.phone,
                city: form.city,
                bio: form.bio

            });


        if (!updated) {

            toast.error(
                t("profileUpdateError")
            );

            setSaving(false);
            return;

        }


        toast.success(
            t("profileUpdated")
        );


        setForm({

            name: updated.name || "",
            surname: updated.surname || "",
            phone: updated.phone || "",
            city: updated.city || "",
            bio: updated.bio || ""

        });


        setEdit(false);

        setSaving(false);

    };


    if (authLoading) {

        return (

            <div className={s.loading}>
                {t("loading")}
            </div>

        );

    }


    if (!user) {

        return (

            <div className={s.loading}>
                {t("noUser")}
            </div>

        );

    }


    const name =
        profile?.name ||
        user.user_metadata?.name ||
        "User";


    const avatar =
        avatarPreview ||
        profile?.avatar_url ||
        user.user_metadata?.avatar_url;


    return (

        <main className={s.profile}>


            <section className={s.profileCard}>


                <div className={s.profileTop}>


                    <div className={s.avatarBlock}>

                        <label className={s.avatar}>

                            {
                                avatar

                                    ?

                                    <img
                                        src={avatar}
                                        alt="avatar"
                                    />

                                    :

                                    <span>
                                        {name[0].toUpperCase()}
                                    </span>
                            }


                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={uploadAvatar}
                            />

                        </label>


                        <label className={s.changeAvatarBtn}>

                            <Camera size={16} />

                            <span>
                                {t("changePhoto")}
                            </span>


                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={uploadAvatar}
                            />

                        </label>


                    </div>


                    <div className={s.profileInfo}>


                        <h1 className={s.profileName}>

                            {name}{" "}

                            {profile?.surname}

                        </h1>


                        <p className={s.email}>

                            {user.email}

                        </p>


                    </div>


                </div>


                <div className={s.line} />


                {

                    edit


                        ?


                        <div className={s.editBox}>


                            <input
                                name="name"
                                value={form.name}
                                onChange={change}
                                placeholder={t("name")}
                            />


                            <input
                                name="surname"
                                value={form.surname}
                                onChange={change}
                                placeholder={t("surname")}
                            />


                            <input
                                name="phone"
                                value={form.phone}
                                onChange={change}
                                placeholder={t("phone")}
                            />


                            <input
                                name="city"
                                value={form.city}
                                onChange={change}
                                placeholder={t("city")}
                            />


                            <textarea
                                name="bio"
                                value={form.bio}
                                onChange={change}
                                placeholder={t("aboutme")}
                            />


                            <button
                                className={s.editBtn}
                                onClick={saveProfile}
                                disabled={saving}
                            >
                                {
                                    saving
                                        ? t("saving")
                                        : t("save")
                                }
                            </button>


                        </div>


                        :


                        <>


                            <div className={s.stats}>


                                <div className={s.stat}>

                                    <span>
                                        {t("phone")}
                                    </span>


                                    <b>

                                        {
                                            profile?.phone ||
                                            t("notAdded")
                                        }

                                    </b>

                                </div>


                                <div className={s.stat}>


                                    <span>
                                        {t("city")}
                                    </span>


                                    <b>

                                        {
                                            profile?.city ||
                                            t("notAdded")
                                        }

                                    </b>


                                </div>


                                <div className={s.stat}>


                                    <span>
                                        {t("joined")}
                                    </span>


                                    <b>

                                        {
                                            new Date(
                                                user.created_at
                                            )
                                                .toLocaleDateString()
                                        }

                                    </b>


                                </div>


                            </div>


                            <div className={s.bio}>


                                <span>
                                    {t("aboutme")}
                                </span>


                                <p>

                                    {
                                        profile?.bio ||
                                        t("emptyBio")
                                    }

                                </p>


                            </div>


                            <div className={s.actions}>


                                <button
                                    className={s.actionBtn}
                                    onClick={() => setEdit(true)}
                                >

                                    {t("editProfile")}

                                </button>


                                <button
                                    className={s.actionBtn}
                                    onClick={() => setPasswordEdit(true)}
                                >

                                    {t("changePassword")}

                                </button>


                                <button
                                    className={`${s.actionBtn} ${s.logoutBtn}`}
                                    onClick={() => setLogoutModal(true)}
                                >
                                    <LogOut size={17} />
                                    {t("logout")}
                                </button>
                                <button
                                    className={s.deleteBtn}
                                    onClick={() => {
                                        setDeleteText("");
                                        setDeleteModal(true);
                                    }}
                                >
                                    <Trash2 size={17} />
                                    {t("deleteAccount")}
                                </button>


                            </div>

                            {
                                passwordEdit &&

                                <div className={s.editBox}>


                                    <div className={s.passwordHeader}>


                                        <h3>
                                            {t("changePassword")}
                                        </h3>


                                        <button

                                            className={s.closeBtn}

                                            onClick={() => {

                                                setPasswordEdit(false);

                                                setPassword({
                                                    newPassword: "",
                                                    confirm: ""
                                                });

                                            }}

                                        >

                                            <X size={18} />

                                        </button>


                                    </div>


                                    <div className={s.passwordInput}>


                                        <input

                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }

                                            placeholder={t("newPassword")}

                                            value={password.newPassword}

                                            onChange={(e) => setPassword({

                                                ...password,

                                                newPassword: e.target.value

                                            })}

                                        />


                                        <button

                                            type="button"

                                            onClick={() => setShowPassword(!showPassword)}

                                        >


                                            {
                                                showPassword

                                                    ?
                                                    <span className={s.icon}>
                                                        <EyeOff size={18} />
                                                    </span>

                                                    :

                                                    <span className={s.icon}>
                                                        <Eye size={18} />
                                                    </span>

                                            }


                                        </button>


                                    </div>


                                    <div className={s.passwordInput}>


                                        <input

                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }

                                            placeholder={t("repeatPassword")}

                                            value={password.confirm}

                                            onChange={(e) => setPassword({

                                                ...password,

                                                confirm: e.target.value

                                            })}

                                        />


                                    </div>


                                    <button
                                        className={s.editBtn}
                                        onClick={changePassword}
                                        disabled={passwordLoading}
                                    >

                                        {
                                            passwordLoading
                                                ? t("saving")
                                                : t("savePassword")
                                        }

                                    </button>


                                </div>
                            }

                        </>


                }


                {
                    logoutModal && (

                        <div className={s.modalBg}>


                            <div className={s.modal}>


                                <h3>
                                    {t("logoutTitle")}
                                </h3>


                                <p>
                                    {t("logoutText")}
                                </p>


                                <div className={s.modalBtns}>


                                    <button
                                        className={s.cancelBtn}
                                        onClick={() => setLogoutModal(false)}
                                    >

                                        {t("cancel")}

                                    </button>


                                    <button
                                        className={s.confirmBtn}
                                        onClick={async () => {


                                            const success = await logout();


                                            if (!success) return;


                                            setLogoutModal(false);


                                        }}
                                    >

                                        {t("logout")}

                                    </button>


                                </div>


                            </div>


                        </div>

                    )
                }
                {
                    deleteModal && (

                        <div className={s.modalBg}>


                            <div className={s.modal}>


                                <h3>
                                    {t("deleteTitle")}
                                </h3>


                                <p>
                                    {t("deleteText")}
                                </p>


                                <input

                                    className={s.deleteInput}

                                    placeholder="DELETE"

                                    value={deleteText}

                                    onChange={
                                        e => setDeleteText(e.target.value)
                                    }

                                />


                                <div className={s.modalBtns}>


                                    <button
                                        className={s.cancelBtn}
                                        onClick={() => setDeleteModal(false)}
                                    >
                                        {t("cancel")}
                                    </button>


                                    <button

                                        className={s.confirmDeleteBtn}

                                        disabled={deleteLoading}

                                        onClick={deleteAccount}

                                    >

                                        {
                                            deleteLoading
                                                ?
                                                t("deleting")
                                                :
                                                t("delete")
                                        }

                                    </button>


                                </div>


                            </div>


                        </div>

                    )
                }
            </section>


        </main>


    );

}
