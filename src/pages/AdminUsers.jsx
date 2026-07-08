import { useContext, useState } from "react";
import { MyContext } from "../Context";
import { useTranslation } from "react-i18next";
import { Search, ShieldCheck, ShieldOff, MapPinned } from "lucide-react";
import s from "./AdminUsers.module.css";

export default function AdminUsers() {

    const { profile, searchUsers, setUserRole } = useContext(MyContext);
    const { t } = useTranslation();

    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);

    const isAdmin = profile?.role === "admin";

    async function handleSearch(e) {
        e?.preventDefault();
        setLoading(true);
        const result = await searchUsers(query);
        setUsers(result);
        setLoading(false);
    }

    async function toggleRole(user) {
        setUpdatingId(user.id);

        const nextRole = user.role === "admin" ? "user" : "admin";
        const updated = await setUserRole(user.id, nextRole);

        if (updated) {
            setUsers(prev =>
                prev.map(u =>
                    u.id === user.id ? { ...u, role: nextRole } : u
                )
            );
        }

        setUpdatingId(null);
    }

    if (!isAdmin) {
        return (
            <div className={s.denied}>
                <p>{t("admin.accessDenied")}</p>
            </div>
        );
    }

    return (
        <main className={s.wrap}>
            <h1>{t("admin.usersTitle")}</h1>

            <form className={s.searchBox} onSubmit={handleSearch}>
                <Search size={18} />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("admin.searchPlaceholder")}
                />
                <button type="submit" disabled={loading}>
                    {loading ? t("admin.searching") : t("admin.search")}
                </button>
            </form>

            <div className={s.list}>
                {users.map(user => (
                    <div key={user.id} className={s.userRow}>

                        <div className={s.userInfo}>
                            <img
                                src={user.avatar_url || "/Profile.svg"}
                                alt={user.name}
                                className={s.avatar}
                            />

                            <div>
                                <h3>{user.name} {user.surname}</h3>
                                <p>
                                    <MapPinned size={14} />
                                    {user.city || t("admin.noCity")}
                                </p>
                            </div>
                        </div>

                        <div className={s.roleBadge}>
                            {user.role === "admin" ? (
                                <span className={s.adminBadge}>
                                    <ShieldCheck size={14} />
                                    {t("admin.roleAdmin")}
                                </span>
                            ) : (
                                <span className={s.userBadge}>
                                    {t("admin.roleUser")}
                                </span>
                            )}
                        </div>

                        <button
                            className={
                                user.role === "admin"
                                    ? s.revokeBtn
                                    : s.grantBtn
                            }
                            onClick={() => toggleRole(user)}
                            disabled={updatingId === user.id}
                        >
                            {updatingId === user.id ? (
                                t("admin.updating")
                            ) : user.role === "admin" ? (
                                <>
                                    <ShieldOff size={16} />
                                    {t("admin.revoke")}
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={16} />
                                    {t("admin.grant")}
                                </>
                            )}
                        </button>

                    </div>
                ))}

                {!loading && users.length === 0 && (
                    <p className={s.empty}>{t("admin.noResults")}</p>
                )}
            </div>
        </main>
    );
}