import { useForm } from "react-hook-form";
import s from "./CreateCard.module.css";
import { useContext } from "react";
import { MyContext } from "../Context";

const CreateCard = () => {

  const {
    createCard,
    uploadImage
  } = useContext(MyContext);

  const {
    register,
    handleSubmit,
    reset
  } = useForm();

  const onSubmit = async (data) => {

    if (!data.image || !data.image.length) {
      alert("Выбери картинку");
      return;
    }

    const file = data.image[0];

    const imageUrl = await uploadImage(file);

    const newCard = {

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

      image: imageUrl,

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
      link: data.link,
    };

    await createCard(newCard);

    reset();
  };

  return (
    <section className={s.createCard}>

      <form
        className={s.form}
        onSubmit={handleSubmit(onSubmit)}
      >

        <h1 className={s.mainTitle}>
          Create Property
        </h1>

        <div className={s.box}>
          <h2 className={s.title}>Title RU</h2>

          <input
            className={s.inp}
            type="text"
            placeholder="Морское Спокойствие"
            {...register("titleRu")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Title EN</h2>

          <input
            className={s.inp}
            type="text"
            placeholder="Seaside Serenity"
            {...register("titleEn")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Title UZ</h2>

          <input
            className={s.inp}
            type="text"
            placeholder="Dengiz Bo'yidagi Sokinlik"
            {...register("titleUz")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Description RU</h2>

          <textarea
            className={s.textarea}
            placeholder="Описание..."
            {...register("descriptionRu")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Description EN</h2>

          <textarea
            className={s.textarea}
            placeholder="Description..."
            {...register("descriptionEn")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Description UZ</h2>

          <textarea
            className={s.textarea}
            placeholder="Tavsif..."
            {...register("descriptionUz")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Image</h2>

          <input
            className={s.inp}
            type="file"
            accept="image/*"
            {...register("image", { required: true })}
          />
        </div>

        <div className={s.row}>

          <div className={s.box}>
            <h2 className={s.title}>Bedrooms RU</h2>

            <input
              className={s.inp}
              type="text"
              placeholder="4 спальни"
              {...register("bedroomsRu")}
            />
          </div>

          <div className={s.box}>
            <h2 className={s.title}>Bedrooms EN</h2>

            <input
              className={s.inp}
              type="text"
              placeholder="4 bedrooms"
              {...register("bedroomsEn")}
            />
          </div>

          <div className={s.box}>
            <h2 className={s.title}>Bedrooms UZ</h2>

            <input
              className={s.inp}
              type="text"
              placeholder="4 yotoqxona"
              {...register("bedroomsUz")}
            />
          </div>

        </div>

        <div className={s.row}>

          <div className={s.box}>
            <h2 className={s.title}>Bathrooms RU</h2>

            <input
              className={s.inp}
              type="text"
              placeholder="3 ванные"
              {...register("bathroomsRu")}
            />
          </div>

          <div className={s.box}>
            <h2 className={s.title}>Bathrooms EN</h2>

            <input
              className={s.inp}
              type="text"
              placeholder="3 bathrooms"
              {...register("bathroomsEn")}
            />
          </div>

          <div className={s.box}>
            <h2 className={s.title}>Bathrooms UZ</h2>

            <input
              className={s.inp}
              type="text"
              placeholder="3 hammom"
              {...register("bathroomsUz")}
            />
          </div>

        </div>

        <div className={s.row}>

          <div className={s.box}>
            <h2 className={s.title}>Type RU</h2>

            <input
              className={s.inp}
              type="text"
              placeholder="Вилла"
              {...register("typeRu")}
            />
          </div>

          <div className={s.box}>
            <h2 className={s.title}>Type EN</h2>

            <input
              className={s.inp}
              type="text"
              placeholder="Villa"
              {...register("typeEn")}
            />
          </div>

          <div className={s.box}>
            <h2 className={s.title}>Type UZ</h2>

            <input
              className={s.inp}
              type="text"
              placeholder="Villa"
              {...register("typeUz")}
            />
          </div>

        </div>

        <div className={s.box}>
          <h2 className={s.title}>Price</h2>

          <input
            className={s.inp}
            type="text"
            placeholder="$550,000"
            {...register("price")}
          />
        </div>

        <div className={s.box}>
          <h2 className={s.title}>Link</h2>

          <input
            className={s.inp}
            type="text"
            placeholder="/Property"
            {...register("link")}
          />
        </div>

        <button
          className={s.btn}
          type="submit"
        >
          Create Property
        </button>

      </form>

    </section>
  );
};

export default CreateCard;