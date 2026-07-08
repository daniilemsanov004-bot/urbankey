import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Phone, Send, ExternalLink } from "lucide-react";
import { MyContext } from "../Context";
import s from "./AdminLeads.module.css";

const STATUSES = ["new", "in_contact", "deal", "closed"];

export default function AdminLeads() {

    const { profile, getLeads, updateLeadStatus } = useContext(MyContext);
    const { t } = useTranslation();

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [updatingId, setUpdatingId] = useState(null);

    const isAdmin = profile?.role === "admin";

    const load = async (statusFilter) => {
        setLoading(true);
        const data = await getLeads(statusFilter);
        setLeads(data);
        setLoading(false);
    };

    useEffect(() => {
        if (isAdmin) {
            load(filter);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, filter]);

    const handleStatusChange = async (id, status) => {
        setUpdatingId(id);
        const updated = await updateLeadStatus(id, status);
        if (updated) {
            setLeads((prev) =>
                prev.map((lead) => (lead.id === id ? { ...lead, status } : lead))
            );
        }
        setUpdatingId(null);
    };

    const statusLabel = (status) => {
        switch (status) {
            case "new": return t("crmStatusNew");
            case "in_contact": return t("crmStatusInContact");
            case "deal": return t("crmStatusDeal");
            case "closed": return t("crmStatusClosed");
            default: return status;
        }
    };

    const typeLabel = (type) =>
        type === "listing_owner" ? t("crmTypeListingOwner") : t("crmTypeContactForm");

    if (!isAdmin) {
        return (
            <div className={s.denied}>
                <p>{t("admin.accessDenied")}</p>
            </div>
        );
    }

    return (
        <main className={s.wrap}>
            <h1>{t("crmLeadsTitle")}</h1>

            <div className={s.filters}>
                {["all", ...STATUSES].map((st) => (
                    <button
                        key={st}
                        className={filter === st ? s.filterActive : s.filterBtn}
                        onClick={() => setFilter(st)}
                    >
                        {st === "all" ? t("crmFilterAll") : statusLabel(st)}
                    </button>
                ))}
            </div>

            {loading && <p className={s.status}>{t("loading")}</p>}

            {!loading && leads.length === 0 && (
                <p className={s.empty}>{t("crmNoLeads")}</p>
            )}

            <div className={s.list}>
                {leads.map((lead) => (
                    <div key={lead.id} className={s.card}>

                        <div className={s.cardHeader}>
                            <span className={s.typeBadge}>{typeLabel(lead.type)}</span>
                            <span className={s.date}>
                                {new Date(lead.created_at).toLocaleString()}
                            </span>
                        </div>

                        <div className={s.contactRow}>
                            {lead.name && <span>{lead.name}</span>}
                            {lead.phone && (
                                <a href={`tel:${lead.phone}`} className={s.contactLink}>
                                    <Phone size={14} /> {lead.phone}
                                </a>
                            )}
                            {lead.telegram && (
                                <a
                                    href={`https://t.me/${lead.telegram.replace("@", "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={s.contactLink}
                                >
                                    <Send size={14} /> {lead.telegram}
                                </a>
                            )}
                        </div>

                        {lead.message && <p className={s.message}>{lead.message}</p>}

                        {lead.related_card_id && (
                            <Link
                                to={`/property/${lead.related_card_id}`}
                                className={s.propertyLink}
                            >
                                <ExternalLink size={14} />
                                {t("crmContactPropertyLink")}
                            </Link>
                        )}

                        <div className={s.statusRow}>
                            {STATUSES.map((st) => (
                                <button
                                    key={st}
                                    className={
                                        lead.status === st ? s.statusActive : s.statusBtn
                                    }
                                    disabled={updatingId === lead.id}
                                    onClick={() => handleStatusChange(lead.id, st)}
                                >
                                    {statusLabel(st)}
                                </button>
                            ))}
                        </div>

                    </div>
                ))}
            </div>
        </main>
    );
}
