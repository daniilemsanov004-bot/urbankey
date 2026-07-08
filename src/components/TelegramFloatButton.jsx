import { Send } from "lucide-react";
import s from "./TelegramFloatButton.module.css";

const TELEGRAM_USERNAME = "VladislavBroker";

const TelegramFloatButton = () => {

    return (
        <a
            href={`https://t.me/${TELEGRAM_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={s.button}
            aria-label="Написать в Telegram"
            title="Написать в Telegram"
        >
            <Send size={22} className={s.icon} strokeWidth={2.2} />
            <span className={s.label}>ЧАТ</span>
        </a>
    );
};

export default TelegramFloatButton;
