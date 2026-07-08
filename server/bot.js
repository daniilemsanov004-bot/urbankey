import "dotenv/config";

import TelegramBot from "node-telegram-bot-api";
import { createClient } from "@supabase/supabase-js";


const bot = new TelegramBot(
    process.env.PARSER_BOT_TOKEN,
    {
        polling: true
    }
);


// ⚠️ Боту нужен service_role ключ (он должен обходить RLS, чтобы вставлять
// строки без авторизованного пользователя). Держите его ТОЛЬКО тут, в
// server/.env, под именем SUPABASE_SERVICE_KEY — без префикса VITE_,
// чтобы Vite не зашил его в бандл сайта.
//
// Временный фолбэк на VITE_SUPABASE_KEY оставлен, чтобы бот не упал,
// пока вы не разнесли ключи, но это тот самый ключ, который сейчас
// светится на сайте — замените его как можно скорее.
const SUPABASE_KEY =
    process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_KEY;

if (!process.env.SUPABASE_SERVICE_KEY) {
    console.warn(
        "⚠️  SUPABASE_SERVICE_KEY не задан — бот использует VITE_SUPABASE_KEY.\n" +
        "    Это тот же ключ, что и на сайте. Если это service_role — срочно" +
        " разнесите ключи (см. комментарий в коде)."
    );
}

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    SUPABASE_KEY
);


bot.on("polling_error", (err) => {
    console.log("TELEGRAM POLLING ERROR:", err.message);
});




// ---------------------------------------------------------------------
// Словарь типов жилья — по ключевым словам в тексте поста определяем
// type_ru/en/uz вместо того чтобы всегда ставить "Квартира".
// ---------------------------------------------------------------------
const TYPE_DICT = [
    { test: /вилл|villa/i, ru: "Вилла", en: "Villa", uz: "Villa" },
    { test: /коттедж|cottage|kottej/i, ru: "Коттедж", en: "Cottage", uz: "Kottej" },
    { test: /резиденци|residence|rezidensiya/i, ru: "Резиденция", en: "Residence", uz: "Rezidensiya" },
    { test: /пентхаус|penthouse|pentxaus/i, ru: "Пентхаус", en: "Penthouse", uz: "Pentxaus" },
    { test: /\bдом\b|\bhouse\b|\buy\b/i, ru: "Дом", en: "House", uz: "Uy" },
    { test: /апартамент|apartment|kvartira|квартир/i, ru: "Апартаменты", en: "Apartments", uz: "Apartament" }
];

function detectType(text) {

    for (const t of TYPE_DICT) {
        if (t.test.test(text)) {
            return { ru: t.ru, en: t.en, uz: t.uz };
        }
    }

    // старое поведение по умолчанию — чтобы не ломать уже привычный формат
    return { ru: "Квартира", en: "Apartment", uz: "Kvartira" };
}




// ---------------------------------------------------------------------
// Разбор текста поста в поля карточки/коммерции.
// Вынесено в отдельную функцию — без побочных эффектов, легко проверить
// на любом тексте (например, в консоли: parseListing("тестовый текст")).
// ---------------------------------------------------------------------
function parseListing(text) {

    const lines =
        text
            .split("\n")
            .map(x => x.trim())
            .filter(Boolean);


    // строки-служебные маркеры, которые точно не являются заголовком
    const isServiceLine = (line) =>
        /^#/.test(line) ||
        /^(EN|UZ|RU_DESC|EN_DESC|UZ_DESC)\s*:/i.test(line) ||
        /^(Цена|Стоимость|Price|Narxi|Ориентир|Landmark|Mo'ljal|Высота потолков|Площадь)\s*:?/i.test(line);


    const title_ru =
        lines.find(line => !isServiceLine(line)) || "Квартира";


    const title_en =
        text.match(/EN:\s*(.*)/)?.[1]?.trim() || "";

    const title_uz =
        text.match(/UZ:\s*(.*)/)?.[1]?.trim() || "";


    const description_ru =
        text.match(/RU_DESC:\s*([\s\S]*?)EN_DESC:/)?.[1]?.trim() || "";

    const description_en =
        text.match(/EN_DESC:\s*([\s\S]*?)UZ_DESC:/)?.[1]?.trim() || "";

    const description_uz =
        text.match(/UZ_DESC:\s*([\s\S]*)/)?.[1]?.trim() || "";


    const price =
        (
            text.match(/(?:Цена|Стоимость|Price|Narxi)\s*:?\s*(.*)/i)?.[1]
            || ""
        ).trim();


    const bedrooms =
        text.match(/(\d+)[хx]\s*комнат/i)?.[1] || "";

    const bathrooms =
        text.match(/(\d+)\s*(?:санузл\w*|ванн\w*|bathroom\w*|hammom\w*)/i)?.[1] || "";


    const isCommercial =
        text.toLowerCase().includes("#коммерция") ||
        text.toLowerCase().includes("коммерц");


    const type = detectType(text);


    const commercialFields = {

        district_ru:
            text.match(/([А-Яа-яёЁ]+ район)/i)?.[1]
            || text.match(/Ориентир:\s*(.*)/i)?.[1]
            || "",

        district_en:
            text.match(/([A-Za-z\s]+district)/i)?.[1]
            || text.match(/Landmark:\s*(.*)/i)?.[1]
            || "",

        district_uz:
            text.match(/([A-Za-zА-Яа-яёЁ\s]+tumani)/i)?.[1]
            || text.match(/Mo'ljal:\s*(.*)/i)?.[1]
            || "",


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
            text.match(/(\d+)\s*(?:этаж|этажа|уровня|уровень)/i)?.[1] || "",

        ceiling:
            text.match(/Высота потолков\s*:?\s*([\d.]+)/i)?.[1] || "",

        area:
            text.match(/Площадь\s*:?\s*([\d.]+\s*м²)/i)?.[1] || ""
    };


    const missing = [];

    if (title_ru === "Квартира" && !/квартир/i.test(text)) missing.push("название");
    if (!price) missing.push("цена");

    if (isCommercial) {
        if (!commercialFields.area) missing.push("площадь");
    } else {
        if (!bedrooms) missing.push("кол-во комнат");
    }


    return {
        isCommercial,
        missing,
        title_ru,
        title_en,
        title_uz,
        description_ru,
        description_en,
        description_uz,
        price,
        bedrooms,
        bathrooms,
        type,
        commercialFields
    };
}




// ---------------------------------------------------------------------
// Загрузка фото в Supabase Storage. Возвращает публичный URL или "".
// ---------------------------------------------------------------------
async function uploadPhoto(photoSizes) {

    try {

        const photo = photoSizes[photoSizes.length - 1];

        const file = await bot.getFile(photo.file_id);

        const url =
            `https://api.telegram.org/file/bot${process.env.PARSER_BOT_TOKEN}/${file.file_path}`;

        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());

        const fileName = `${Date.now()}.jpg`;

        const { error } =
            await supabase.storage
                .from("images")
                .upload(fileName, buffer, { contentType: "image/jpeg" });

        if (error) {
            console.log("UPLOAD ERROR:", error);
            return "";
        }

        const { data } =
            supabase.storage.from("images").getPublicUrl(fileName);

        return data.publicUrl;

    } catch (e) {

        console.log("UPLOAD EXCEPTION:", e);
        return "";
    }
}




// ---------------------------------------------------------------------
// Память о недавно созданных записях: chatId:messageId -> { table, id }.
// Нужна, чтобы редактирование поста в канале (edited_channel_post)
// могло обновить уже созданную запись, а не создавать новую.
// Живёт, пока запущен процесс бота (сбрасывается при рестарте) —
// для полной надёжности после рестарта нужна колонка tg_message_id
// в таблицах, но это отдельная миграция, не обязательная для работы.
// ---------------------------------------------------------------------
const recentPosts = new Map();

function rememberPost(chatId, messageId, table, id) {

    const key = `${chatId}:${messageId}`;
    recentPosts.set(key, { table, id, at: Date.now() });

    // не даём карте расти бесконечно — чистим записи старше суток
    if (recentPosts.size > 500) {
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        for (const [k, v] of recentPosts) {
            if (v.at < dayAgo) recentPosts.delete(k);
        }
    }
}




// ---------------------------------------------------------------------
// Группировка альбомов (несколько фото в одном посте).
// Telegram присылает каждое фото альбома отдельным channel_post с
// одинаковым media_group_id, и подпись обычно есть только у одного
// из них. Без группировки это превращалось в несколько карточек —
// одну нормальную и несколько пустых.
// ---------------------------------------------------------------------
const pendingGroups = new Map();

function handleIncomingPost(msg) {

    if (!msg.media_group_id) {
        processPost(msg, [msg]);
        return;
    }

    const key = msg.media_group_id;

    if (!pendingGroups.has(key)) {
        pendingGroups.set(key, { messages: [], timer: null });
    }

    const group = pendingGroups.get(key);
    group.messages.push(msg);

    clearTimeout(group.timer);

    // ждём ~1.5с — за это время успевают прийти все фото альбома
    group.timer = setTimeout(() => {

        pendingGroups.delete(key);

        const mainMsg =
            group.messages.find(m => m.caption) || group.messages[0];

        processPost(mainMsg, group.messages);

    }, 1500);
}




// ---------------------------------------------------------------------
// Собственно обработка поста: парсинг, загрузка фото, запись в базу,
// ответ в канал с результатом (успех / чего не хватает / ошибка).
// ---------------------------------------------------------------------
async function processPost(mainMsg, allMsgs) {

    try {

        const text = mainMsg.caption || mainMsg.text || "";

        if (!text.trim() && !allMsgs.some(m => m.photo)) {
            // пустой служебный пост канала (например, чужой репост без текста и фото)
            return;
        }

        const parsed = parseListing(text);

        // фото может быть не в том сообщении, где текст (актуально для альбомов)
        const photoMsg =
            allMsgs.find(m => m.photo) || null;

        const image =
            photoMsg ? await uploadPhoto(photoMsg.photo) : "";

        if (!image) parsed.missing.push("фото");


        const baseFields = {
            title_ru: parsed.title_ru,
            title_en: parsed.title_en,
            title_uz: parsed.title_uz,
            description_ru: parsed.description_ru,
            description_en: parsed.description_en,
            description_uz: parsed.description_uz,
            image,
            price: parsed.price
        };


        const insertData = parsed.isCommercial
            ? { ...baseFields, ...parsed.commercialFields }
            : {
                ...baseFields,
                bedrooms_ru: parsed.bedrooms ? `${parsed.bedrooms} спальни` : "",
                bedrooms_en: parsed.bedrooms ? `${parsed.bedrooms} bedrooms` : "",
                bedrooms_uz: parsed.bedrooms ? `${parsed.bedrooms} yotoqxona` : "",
                bathrooms_ru: parsed.bathrooms ? `${parsed.bathrooms} ванные` : "",
                bathrooms_en: parsed.bathrooms ? `${parsed.bathrooms} bathrooms` : "",
                bathrooms_uz: parsed.bathrooms ? `${parsed.bathrooms} hammom` : "",
                type_ru: parsed.type.ru,
                type_en: parsed.type.en,
                type_uz: parsed.type.uz
            };


        const table = parsed.isCommercial ? "commercials" : "cardss";

        const { data, error } =
            await supabase
                .from(table)
                .insert(insertData)
                .select("id")
                .single();


        if (error) {

            console.log("❌ DB ERROR:", error);

            await replyToChannel(
                mainMsg,
                `❌ Не удалось сохранить объект: ${error.message}`
            );

            return;
        }


        rememberPost(mainMsg.chat.id, mainMsg.message_id, table, data.id);

        console.log(`🔥 Добавлено в ${table}, id=${data.id}`);

        const label = parsed.isCommercial ? "коммерция" : "жильё";

        if (parsed.missing.length) {

            await replyToChannel(
                mainMsg,
                `⚠️ Добавлено (${label}): «${parsed.title_ru}».\n` +
                `Не распознано: ${parsed.missing.join(", ")} — проверьте и дозаполните в админ-панели.`
            );

        } else {

            await replyToChannel(
                mainMsg,
                `✅ Добавлено (${label}): «${parsed.title_ru}» — ${parsed.price || "цена не указана"}`
            );
        }


    } catch (e) {

        console.log("PROCESS POST EXCEPTION:", e);

        await replyToChannel(
            mainMsg,
            "❌ Не удалось обработать пост — проверьте формат вручную."
        );
    }
}




async function replyToChannel(msg, text) {

    try {

        await bot.sendMessage(msg.chat.id, text, {
            reply_to_message_id: msg.message_id
        });

    } catch (e) {

        // если у бота нет прав отвечать в канале — не роняем процесс
        console.log("REPLY ERROR:", e.message);
    }
}




// ---------------------------------------------------------------------
// Редактирование поста в канале.
// Если запись была создана недавно (бот не перезапускался с тех пор) —
// обновляем её вместо создания новой. Иначе честно предупреждаем, что
// автосинхронизация недоступна для старых постов.
// ---------------------------------------------------------------------
bot.on("edited_channel_post", async (msg) => {

    try {

        const key = `${msg.chat.id}:${msg.message_id}`;
        const known = recentPosts.get(key);

        if (!known) {

            await replyToChannel(
                msg,
                "✏️ Пост отредактирован, но карточка была создана слишком давно (или бот перезапускался) — " +
                "автосинхронизация недоступна. Поправьте объект вручную в админ-панели."
            );

            return;
        }

        const text = msg.caption || msg.text || "";
        const parsed = parseListing(text);

        const updateData = parsed.isCommercial
            ? {
                title_ru: parsed.title_ru,
                title_en: parsed.title_en,
                title_uz: parsed.title_uz,
                description_ru: parsed.description_ru,
                description_en: parsed.description_en,
                description_uz: parsed.description_uz,
                price: parsed.price,
                ...parsed.commercialFields
            }
            : {
                title_ru: parsed.title_ru,
                title_en: parsed.title_en,
                title_uz: parsed.title_uz,
                description_ru: parsed.description_ru,
                description_en: parsed.description_en,
                description_uz: parsed.description_uz,
                price: parsed.price,
                bedrooms_ru: parsed.bedrooms ? `${parsed.bedrooms} спальни` : "",
                bedrooms_en: parsed.bedrooms ? `${parsed.bedrooms} bedrooms` : "",
                bedrooms_uz: parsed.bedrooms ? `${parsed.bedrooms} yotoqxona` : "",
                bathrooms_ru: parsed.bathrooms ? `${parsed.bathrooms} ванные` : "",
                bathrooms_en: parsed.bathrooms ? `${parsed.bathrooms} bathrooms` : "",
                bathrooms_uz: parsed.bathrooms ? `${parsed.bathrooms} hammom` : "",
                type_ru: parsed.type.ru,
                type_en: parsed.type.en,
                type_uz: parsed.type.uz
            };

        // фото при редактировании не трогаем — Telegram не всегда шлёт его
        // повторно в edited_channel_post, перезаписывать пустым URL опасно
        if (msg.photo) {
            updateData.image = await uploadPhoto(msg.photo);
        }

        const { error } =
            await supabase
                .from(known.table)
                .update(updateData)
                .eq("id", known.id);

        if (error) {

            console.log("❌ UPDATE ERROR:", error);
            await replyToChannel(msg, `❌ Не удалось обновить объект: ${error.message}`);
            return;
        }

        await replyToChannel(msg, `✏️ Объект «${parsed.title_ru}» обновлён на сайте`);

    } catch (e) {

        console.log("EDIT HANDLER EXCEPTION:", e);
    }
});




bot.on("channel_post", handleIncomingPost);
