import { Phone } from "lucide-react";
import s from "./CallFloatButton.module.css";

const PHONE_NUMBER = "+998 78 707 04 47";
const PHONE_HREF = "+998787070447";

const CallFloatButton = () => {

    return (
        <a
            href={`tel:${PHONE_HREF}`}
            className={s.button}
            aria-label={`Позвонить: ${PHONE_NUMBER}`}
            title={`Позвонить: ${PHONE_NUMBER}`}
        >
            <Phone size={22} className={s.icon} strokeWidth={2.2} />
            <span className={s.label}>ЗВОНОК</span>
        </a>
    );
};

export default CallFloatButton;
