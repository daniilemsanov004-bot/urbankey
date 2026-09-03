import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Home, Search, ArrowLeft } from "lucide-react";
import s from "./Error.module.css";
import Seo from "../components/Seo";
import { localizedPath } from "../utils/lang";

const Error = () => {

  const { t, i18n } = useTranslation();

  return (
    <section className={s.wrap}>
      <Seo title="Страница не найдена" noIndex />

      <div className={s.skyline} aria-hidden="true">
        <img src="/city-skyline.svg" alt="" />
      </div>

      <div className={s.container}>

        <motion.p
          className={s.code}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          404
        </motion.p>

        <motion.h1
          className={s.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {t("notFound.title")}
        </motion.h1>

        <motion.p
          className={s.subtitle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {t("notFound.subtitle")}
        </motion.p>

        <motion.div
          className={s.actions}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >

          <Link to={localizedPath("/", i18n.language)} className={s.primaryBtn}>
            <Home size={18} />
            {t("notFound.backHome")}
          </Link>

          <Link to={localizedPath("/Properties", i18n.language)} className={s.secondaryBtn}>
            <Search size={18} />
            {t("notFound.backCatalog")}
          </Link>

          <button
            type="button"
            className={s.linkBtn}
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={16} />
            {t("notFound.goBack")}
          </button>

        </motion.div>

      </div>

    </section>
  );
};

export default Error;
