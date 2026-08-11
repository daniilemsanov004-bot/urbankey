import { Link } from "react-router-dom";
import { useContext } from "react";
import { MyContext } from "../Context";
import s from "./Admin.module.css";


const Admin = () => {

  const { profile } = useContext(MyContext);

  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    return (
      <section className={s.admin}>
        <p className={s.denied}>Доступ только для администраторов.</p>
      </section>
    );
  }

  return (

    <section className={s.admin}>

      <Link className={s.link} to="/admin/createCard">
        Создать карточку квартиры 
      </Link>

      <Link className={s.link} to="/admin/changeCard">
        Изменить карточку квартиры 
      </Link>

      <Link className={s.link} to="/admin/CreateVilla">
        Создать страницу квартиры  
      </Link>

      <Link className={s.link} to="/admin/changeVilla">
        Изменить  страницу квартиры 
      </Link>

      <Link className={s.link} to="/admin/createCommercialPage">
        Создать страницу коммерции
      </Link>

      <Link className={s.link} to="/admin/changeCommercialPage">
        Изменить страницу коммерции
      </Link>

      <Link className={s.link} to="/admin/users">
        Управление пользователями
      </Link>

      <Link className={s.link} to="/admin/leads">
        Заявки (CRM)
      </Link>

    </section>

  );

};


export default Admin;