import { useForm } from "react-hook-form";
import s from "./ChangeCard.module.css";
import { useParams, Link } from "react-router-dom";
import { useContext, useEffect } from "react";
import { MyContext } from "../Context";

const ChangeCard = () => {

  const { id } = useParams();

  const {
    properties,
    getCards,
    cardId,
    getCardId,
    changeCard
  } = useContext(MyContext);
  const {
    deleteVilla
  } = useContext(MyContext)

  const {
    register,
    handleSubmit,
    setValue
  } = useForm();

  useEffect(() => {
    getCards();
  }, []);

  useEffect(() => {
    if (id) {
      getCardId(id);
    }
  }, [id]);

  useEffect(() => {

    if (cardId) {

      setValue("titleRu", cardId.title?.ru || "");
      setValue("titleEn", cardId.title?.en || "");
      setValue("titleUz", cardId.title?.uz || "");

      setValue("descriptionRu", cardId.description?.ru || "");
      setValue("descriptionEn", cardId.description?.en || "");
      setValue("descriptionUz", cardId.description?.uz || "");

      setValue("image", cardId.image);

      setValue("bedroomsRu", cardId.bedrooms?.ru || "");
      setValue("bedroomsEn", cardId.bedrooms?.en || "");
      setValue("bedroomsUz", cardId.bedrooms?.uz || "");

      setValue("bathroomsRu", cardId.bathrooms?.ru || "");
      setValue("bathroomsEn", cardId.bathrooms?.en || "");
      setValue("bathroomsUz", cardId.bathrooms?.uz || "");

      setValue("typeRu", cardId.type?.ru || "");
      setValue("typeEn", cardId.type?.en || "");
      setValue("typeUz", cardId.type?.uz || "");

      setValue("price", cardId.price);

      setValue("link", cardId.link);
    }

  }, [cardId]);

  const onSubmit = (data) => {

    const updatedCard = {
      title: {
        ru: data.titleRu,
        en: data.titleEn,
        uz: data.titleUz,
      },

      description: {
        ru: data.descriptionRu,
        en: data.descriptionEn,
        uz: data.descriptionUz,
      },

      image: data.image,

      bedroomIcon: "/BACKGROUND_2.svg",
      bathroomIcon: "/Icon.svg",
      typeIcon: "/Icon (1).svg",

      bedrooms: {
        ru: data.bedroomsRu,
        en: data.bedroomsEn,
        uz: data.bedroomsUz,
      },

      bathrooms: {
        ru: data.bathroomsRu,
        en: data.bathroomsEn,
        uz: data.bathroomsUz,
      },

      type: {
        ru: data.typeRu,
        en: data.typeEn,
        uz: data.typeUz,
      },

      price: data.price,
      link: data.link
    };

    changeCard(updatedCard, id);
  };

  if (!id) {

    return (

      <section className={s.cards}>

        <h1>
          Choose Property
        </h1>

        {properties.map((item) => (

          <div
            key={item.id}
            className={s.card}
          >

            <h2>
              {item.title?.en}
            </h2>


            <div className={s.actions}>


              <Link
                to={`/admin/changeCard/${item.id}`}
                className={s.link}
              >
                Edit
              </Link>



              <Link
                to={`/admin/CreateVilla/${item.id}`}
                className={s.link}
              >
                Создать страницу
              </Link>
              

            </div>


          </div>

        ))}

      </section>
    );
  }

  return (

    <section className={s.changeCard}>

      <form
        className={s.form}
        onSubmit={handleSubmit(onSubmit)}
      >

        <h1 className={s.mainTitle}>
         Изменить 
        </h1>

        <div className={s.box}>
          <h2 className={s.title}>Название RU</h2>

          <input
            className={s.inp}
            type="text"
            {...register("titleRu")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Название EN</h2>

          <input
            className={s.inp}
            type="text"
            {...register("titleEn")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Название UZ</h2>

          <input
            className={s.inp}
            type="text"
            {...register("titleUz")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Описание RU</h2>

          <textarea
            className={s.textarea}
            {...register("descriptionRu")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Описание EN</h2>

          <textarea
            className={s.textarea}
            {...register("descriptionEn")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Описание UZ</h2>

          <textarea
            className={s.textarea}
            {...register("descriptionUz")}
          />
        </div>

        <div className={s.box}>

          <h2 className={s.title}>
            Фото
          </h2>

          <input
            className={s.inp}
            type="text"
            {...register("image")}
          />

        </div>

        <div className={s.box}>
          <h2 className={s.title}>Комнаты RU</h2>

          <input
            className={s.inp}
            type="text"
            {...register("bedroomsRu")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Комнаты EN</h2>

          <input
            className={s.inp}
            type="text"
            {...register("bedroomsEn")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Комнаты UZ</h2>

          <input
            className={s.inp}
            type="text"
            {...register("bedroomsUz")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Этаж RU</h2>

          <input
            className={s.inp}
            type="text"
            {...register("bathroomsRu")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Этаж  EN</h2>

          <input
            className={s.inp}
            type="text"
            {...register("bathroomsEn")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Этаж UZ</h2>

          <input
            className={s.inp}
            type="text"
            {...register("bathroomsUz")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Тип RU</h2>

          <input
            className={s.inp}
            type="text"
            {...register("typeRu")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Тип EN</h2>

          <input
            className={s.inp}
            type="text"
            {...register("typeEn")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Тип UZ</h2>

          <input
            className={s.inp}
            type="text"
            {...register("typeUz")}
          />
        </div>

        <div className={s.box}>

          <h2 className={s.title}>
            Цена
          </h2>

          <input
            className={s.inp}
            type="text"
            {...register("price")}
          />

        </div>

        <div className={s.box}>

          <h2 className={s.title}>
            Link
          </h2>

          <input
            className={s.inp}
            type="text"
            {...register("link")}
          />

        </div>

        <button
          className={s.btn}
          type="submit"
        >
          Сохранить изменения 
        </button>

      </form>

    </section>
  );
};

export default ChangeCard;