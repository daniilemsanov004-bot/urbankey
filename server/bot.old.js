import "dotenv/config";

import TelegramBot from "node-telegram-bot-api";
import { createClient } from "@supabase/supabase-js";


const bot = new TelegramBot(
    process.env.VITE_TELEGRAM_TOKEN,
    {
        polling: true
    }
);


const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_KEY
);



bot.on("channel_post", async (msg) => {

    try {


        const text =
            msg.caption || msg.text || "";



        const lines =
            text
                .split("\n")
                .map(x => x.trim())
                .filter(Boolean);



        const title_ru =
            lines.find(
                line =>
                    !line.startsWith("#") &&
                    !line.startsWith("EN:") &&
                    !line.startsWith("UZ:")
            ) || "Квартира";



        const title_en =
            text.match(/EN:\s*(.*)/)?.[1] || "";


        const title_uz =
            text.match(/UZ:\s*(.*)/)?.[1] || "";




        const description_ru =
            text.match(/RU_DESC:\s*([\s\S]*?)EN_DESC:/)?.[1]
                ?.trim() || "";


        const description_en =
            text.match(/EN_DESC:\s*([\s\S]*?)UZ_DESC:/)?.[1]
                ?.trim() || "";


        const description_uz =
            text.match(/UZ_DESC:\s*([\s\S]*)/)?.[1]
                ?.trim() || "";




        const price =
            (
                text.match(
                    /(?:Цена|Стоимость|Price|Narxi)\s*:?\s*(.*)/i
                )?.[1]
                || ""
            )
                .trim();




        const bedrooms =
            text.match(/(\d+)[хx]\s*комнат/i)?.[1]
            || "";




        const isCommercial =
            text.toLowerCase().includes("#коммерция") ||
            text.toLowerCase().includes("коммерц");




        let image = "";



        if (msg.photo) {


            const photo =
                msg.photo[msg.photo.length - 1];


            const file =
                await bot.getFile(photo.file_id);



            const url =
                `https://api.telegram.org/file/bot${process.env.VITE_TELEGRAM_TOKEN}/${file.file_path}`;



            const response =
                await fetch(url);



            const buffer =
                Buffer.from(
                    await response.arrayBuffer()
                );



            const fileName =
                `${Date.now()}.jpg`;



            const { error } =
                await supabase.storage
                    .from("images")
                    .upload(
                        fileName,
                        buffer,
                        {
                            contentType: "image/jpeg"
                        }
                    );



            if (!error) {

                const { data } =
                    supabase.storage
                        .from("images")
                        .getPublicUrl(fileName);


                image =
                    data.publicUrl;
            }
        }







        const insertData = isCommercial
            ? {


                title_ru,
                title_en,
                title_uz,


                description_ru,
                description_en,
                description_uz,


                image,


                price,




                district_ru:
                    text.match(/([А-Яа-яёЁ]+ район)/i)?.[1]
                    ||
                    text.match(/Ориентир:\s*(.*)/i)?.[1]
                    ||
                    "",


                district_en:
                    text.match(/([A-Za-z\s]+district)/i)?.[1]
                    ||
                    text.match(/Landmark:\s*(.*)/i)?.[1]
                    ||
                    "",


                district_uz:
                    text.match(/([A-Za-zА-Яа-яёЁ\s]+tumani)/i)?.[1]
                    ||
                    text.match(/Mo'ljal:\s*(.*)/i)?.[1]
                    ||
                    "",



                address_ru:
                    text.match(/район,\s*(.*?)\./i)?.[1] || "",


                address_en:
                    text.match(/district,\s*(.*?)\./i)?.[1] || "",


                address_uz:
                    text.match(/tumani,\s*(.*?)\./i)?.[1] || "",




                landmark_ru:
                    text.match(/Ориентир:\s*(.*)/i)?.[1] || "",


                landmark_en:
                    text.match(/Landmark:\s*(.*)/i)?.[1] || "",


                landmark_uz:
                    text.match(/Mo'ljal:\s*(.*)/i)?.[1] || "",





                floor:
                    text.match(
                        /(\d+)\s*(?:этаж|этажа|уровня|уровень)/i
                    )?.[1] || "",



                ceiling:
                    text.match(
                        /Высота потолков\s*:?\s*([\d.]+)/i
                    )?.[1] || "",



                area:
                    text.match(
                        /Площадь\s*:?\s*([\d.]+\s*м²)/i
                    )?.[1] || ""



            }

            :

            {


                title_ru,
                title_en,
                title_uz,


                description_ru,
                description_en,
                description_uz,


                image,


                price,



                bedrooms_ru: bedrooms,
                bedrooms_en: bedrooms,
                bedrooms_uz: bedrooms,


                type_ru: "Квартира",
                type_en: "Apartment",
                type_uz: "Kvartira"


            };






        const { error } =
            await supabase
                .from(
                    isCommercial
                        ? "commercials"
                        : "cardss"
                )
                .insert(insertData);




        if (error) {

            console.log("❌ ERROR");
            console.log(error);

        } else {

            console.log("🔥 Добавлено");

        }



    }

    catch (e) {

        console.log(e);

    }

});