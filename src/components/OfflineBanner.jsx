import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useTranslation } from "react-i18next";
import { WifiOff, Wifi } from "lucide-react";
import s from "./OfflineBanner.module.css";

const OfflineBanner = () => {
    const { isOnline, justReconnected } = useOnlineStatus();
    const { t } = useTranslation();

    if (isOnline && !justReconnected) return null;

    return (
        <div className={isOnline ? `${s.banner} ${s.online}` : `${s.banner} ${s.offline}`} role="status">
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{isOnline ? t("backOnline") : t("offlineWarning")}</span>
        </div>
    );
};

export default OfflineBanner;
