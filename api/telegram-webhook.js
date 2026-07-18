// /api/telegram-webhook — принимает посты из Telegram-канала через
// webhook вместо long-polling. Работает как обычная serverless-функция
// на том же хостинге (Vercel), что и сайт — не нужен отдельный сервер
// и не нужно ничего запускать руками в терминале.
//
// КАК ПОДКЛЮЧИТЬ (один раз, после деплоя):
//   1. В Vercel -> Settings -> Environment Variables добавьте:
//        PARSER_BOT_TOKEN         — токен вашего Telegram-бота
//        SUPABASE_SERVICE_KEY     — service_role ключ Supabase (НЕ тот,
//                                    что в VITE_SUPABASE_KEY на фронте!)
//        VITE_SUPABASE_URL        — уже должен быть настроен
//        TELEGRAM_WEBHOOK_SECRET  — придумайте любую случайную строку
//   2. Выполните sql/add_webhook_support.sql в Supabase (один раз).
//   3. Скажите Telegram, куда слать посты (тоже один раз, с вашего
//      компьютера, curl или в браузере):
//
//      https://api.telegram.org/bot<PARSER_BOT_TOKEN>/setWebhook?url=https://ВАШ-ДОМЕН/api/telegram-webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>&allowed_updates=["channel_post","edited_channel_post"]
//
//      (замените <PARSER_BOT_TOKEN>, ВАШ-ДОМЕН и <TELEGRAM_WEBHOOK_SECRET>
//       на реальные значения; можно просто открыть эту ссылку в браузере)
//
//   После этого никакой терминал не нужен — Telegram сам стучится в
//   /api/telegram-webhook при каждом новом посте, и это работает всегда,
//   пока задеплоен сайт.

import { createClient } from "@supabase/supabase-js";

import {
    parseListing,
    fillMissingTranslations,
    priceToNumber,
    slugify
} from "../server/listingParser.js";


const BOT_TOKEN = process.env.PARSER_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);


async function telegramApi(method, params) {

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
    });

    const data = await res.json();

    if (!data.ok) {
        console.log(`TELEGRAM API ERROR (${method}):`, data.description);
    }

    return data;
}


async function replyToChannel(msg, text) {
    try {
        await telegramApi("sendMessage", {
            chat_id: msg.chat.id,
            text,
            reply_to_message_id: msg.message_id
        });
    } catch (e) {
        console.log("REPLY ERROR:", e.message);
    }
}


async function uploadPhoto(photoSizes) {

    try {

        const photo = photoSizes[photoSizes.length - 1];

        const fileResp = await telegramApi("getFile", { file_id: photo.file_id });
        if (!fileResp.ok) return "";

        const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileResp.result.file_path}`;

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

        const { data } = supabase.storage.from("images").getPublicUrl(fileName);
        return data.publicUrl;

    } catch (e) {

        console.log("UPLOAD EXCEPTION:", e);
        return "";
    }
}


async function createDraftPage(table, linkIdField, cardId, parsed, image) {

    try {

        const slug = `${slugify(parsed.title_en || parsed.title_ru)}-${cardId}`;

        const basePayload = {
            [linkIdField]: cardId,
            slug,

            title_ru: parsed.title_ru,
            title_en: parsed.title_en,
            title_uz: parsed.title_uz,

            description_ru: parsed.description_ru,
            description_en: parsed.description_en,
            description_uz: parsed.description_uz,

            about_ru: "",
            about_en: "",
            about_uz: "",

            price: priceToNumber(parsed.price),

            images: image ? [image] : [],
            amenities: [],

            is_draft: true
        };

        let payload;

        if (table === "commercial_pages") {

            payload = {
                ...basePayload,
                location_ru: parsed.commercialFields.district_ru || parsed.locationLine,
                location_en: "",
                location_uz: "",
                type_ru: parsed.type.ru,
                type_en: parsed.type.en,
                type_uz: parsed.type.uz,
                class_ru: "",
                class_en: "",
                class_uz: "",
                purpose_ru: "",
                purpose_en: "",
                purpose_uz: "",
                area: Number(parsed.commercialFields.area) || null,
                ceiling_height: Number(parsed.commercialFields.ceiling) || null,
                floor: Number(parsed.commercialFields.floor) || null
            };

        } else {

            payload = {
                ...basePayload,
                location_ru: parsed.locationLine,
                location_en: "",
                location_uz: "",
                type_ru: parsed.type.ru,
                type_en: parsed.type.en,
                type_uz: parsed.type.uz,
                bedrooms: Number(parsed.bedrooms) || null,
                year: null,
                square: Number(parsed.area) || null
            };
        }

        await fillMissingTranslations(payload, ["location"]);

        const { error } = await supabase.from(table).insert(payload);

        if (error) {
            console.log(`DRAFT PAGE (${table}) ERROR:`, error);
            return false;
        }

        return true;

    } catch (e) {

        console.log("DRAFT PAGE EXCEPTION:", e);
        return false;
    }
}


async function processPost(mainMsg, image, hasVideo) {

    const text = mainMsg.caption || mainMsg.text || "";
    const parsed = parseListing(text);

    if (parsed.isSold) {
        await replyToChannel(mainMsg, "ℹ️ Похоже, объект уже продан/снят — пост не публикую на сайт. Если это не так, добавьте объект вручную в админке.");
        return;
    }

    await fillMissingTranslations(parsed, ["title", "description"]);

    if (parsed.isCommercial) {
        await fillMissingTranslations(parsed.commercialFields, ["district", "address", "landmark"]);
    }

    if (!image && !hasVideo) parsed.missing.push("фото");

    const baseFields = {
        title_ru: parsed.title_ru,
        title_en: parsed.title_en,
        title_uz: parsed.title_uz,
        description_ru: parsed.description_ru,
        description_en: parsed.description_en,
        description_uz: parsed.description_uz,
        image,
        price: parsed.price,
        tg_chat_id: mainMsg.chat.id,
        tg_message_id: mainMsg.message_id
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
        await supabase.from(table).insert(insertData).select("id").single();

    if (error) {
        console.log("DB ERROR:", error);
        await replyToChannel(mainMsg, `❌ Не удалось сохранить объект: ${error.message}`);
        return;
    }

    const link = parsed.isCommercial ? `/commercial/${data.id}` : `/property/${data.id}`;
    await supabase.from(table).update({ link }).eq("id", data.id);

    const draftTable = parsed.isCommercial ? "commercial_pages" : "villas";
    const draftLinkField = parsed.isCommercial ? "commercial_id" : "card_id";
    const draftOk = await createDraftPage(draftTable, draftLinkField, data.id, parsed, image);

    const label = parsed.isCommercial ? "коммерция" : "жильё";

    let statusLine = parsed.missing.length
        ? `⚠️ Добавлено (${label}): «${parsed.title_ru}».\nНе распознано: ${parsed.missing.join(", ")} — проверьте и дозаполните в админ-панели.`
        : `✅ Добавлено (${label}): «${parsed.title_ru}» — ${parsed.price || "цена не указана"}`;

    statusLine += draftOk
        ? "\n📝 Черновик страницы объекта создан — откройте её в админке и дозаполните описание/удобства/доп. фото."
        : "\n⚠️ Карточка создана, но черновик страницы объекта создать не удалось — заведите её вручную.";

    await replyToChannel(mainMsg, statusLine);
}


// Редактирование поста: ищем карточку по tg_chat_id+tg_message_id — эти
// колонки появляются после sql/add_webhook_support.sql. Проверяем обе
// таблицы, т.к. без повторного парсинга не знаем заранее, в какой из них
// лежит объект.
async function processEditedPost(msg) {

    const text = msg.caption || msg.text || "";
    const parsed = parseListing(text);

    await fillMissingTranslations(parsed, ["title", "description"]);
    if (parsed.isCommercial) {
        await fillMissingTranslations(parsed.commercialFields, ["district", "address", "landmark"]);
    }

    const lookup = async (table) => {
        const { data } = await supabase
            .from(table)
            .select("id")
            .eq("tg_chat_id", msg.chat.id)
            .eq("tg_message_id", msg.message_id)
            .maybeSingle();
        return data;
    };

    const cardMatch = await lookup("cardss");
    const commercialMatch = cardMatch ? null : await lookup("commercials");

    const table = cardMatch ? "cardss" : (commercialMatch ? "commercials" : null);
    const id = cardMatch?.id || commercialMatch?.id;

    if (!table) {
        await replyToChannel(
            msg,
            "✏️ Пост отредактирован, но карточка на сайте не найдена (возможно, была создана до подключения вебхука) — поправьте объект вручную в админ-панели."
        );
        return;
    }

    const updateData = parsed.isCommercial
        ? {
            title_ru: parsed.title_ru, title_en: parsed.title_en, title_uz: parsed.title_uz,
            description_ru: parsed.description_ru, description_en: parsed.description_en, description_uz: parsed.description_uz,
            price: parsed.price,
            ...parsed.commercialFields
        }
        : {
            title_ru: parsed.title_ru, title_en: parsed.title_en, title_uz: parsed.title_uz,
            description_ru: parsed.description_ru, description_en: parsed.description_en, description_uz: parsed.description_uz,
            price: parsed.price,
            bedrooms_ru: parsed.bedrooms ? `${parsed.bedrooms} спальни` : "",
            bedrooms_en: parsed.bedrooms ? `${parsed.bedrooms} bedrooms` : "",
            bedrooms_uz: parsed.bedrooms ? `${parsed.bedrooms} yotoqxona` : "",
            bathrooms_ru: parsed.bathrooms ? `${parsed.bathrooms} ванные` : "",
            bathrooms_en: parsed.bathrooms ? `${parsed.bathrooms} bathrooms` : "",
            bathrooms_uz: parsed.bathrooms ? `${parsed.bathrooms} hammom` : "",
            type_ru: parsed.type.ru, type_en: parsed.type.en, type_uz: parsed.type.uz
        };

    if (msg.photo) {
        updateData.image = await uploadPhoto(msg.photo);
    }

    const { error } = await supabase.from(table).update(updateData).eq("id", id);

    if (error) {
        await replyToChannel(msg, `❌ Не удалось обновить объект: ${error.message}`);
        return;
    }

    await replyToChannel(msg, `✏️ Объект «${parsed.title_ru}» обновлён на сайте`);
}


// Склейка альбома через Supabase (см. комментарий в sql/add_webhook_support.sql):
// каждое фото альбома прилетает отдельным вызовом функции, порядок не
// гарантирован. Работаем так: если в этом сообщении уже есть текст —
// обрабатываем сразу и помечаем группу как processed; если текста нет —
// просто запоминаем фото и ждём сообщение с текстом.
async function handleAlbumMessage(msg) {

    const groupId = String(msg.media_group_id);
    const text = msg.caption || msg.text || "";
    const hasOwnPhoto = Boolean(msg.photo);

    const { data: existing } = await supabase
        .from("bot_pending_albums")
        .select("*")
        .eq("media_group_id", groupId)
        .maybeSingle();

    if (existing?.processed) {
        // карточка по этой группе уже создана другим сообщением альбома
        return;
    }

    let image = existing?.image || "";
    if (!image && hasOwnPhoto) {
        image = await uploadPhoto(msg.photo);
    }

    if (!text.trim()) {
        // текста в этом сообщении нет — просто сохраняем фото и ждём
        await supabase.from("bot_pending_albums").upsert({
            media_group_id: groupId,
            image,
            processed: false
        });
        return;
    }

    // это сообщение с текстом — обрабатываем группу целиком прямо сейчас
    await supabase.from("bot_pending_albums").upsert({
        media_group_id: groupId,
        image,
        processed: true
    });

    await processPost(msg, image, allHasVideo(msg));
}

function allHasVideo(msg) {
    return Boolean(msg.video);
}


export default async function handler(req, res) {

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (WEBHOOK_SECRET) {
        const provided = req.headers["x-telegram-bot-api-secret-token"];
        if (provided !== WEBHOOK_SECRET) {
            return res.status(401).json({ error: "Invalid secret token" });
        }
    }

    const update = req.body || {};

    // отвечаем Telegram сразу после того, как приняли апдейт в обработку —
    // сама обработка (перевод/загрузка фото/запись в базу) может занять
    // несколько секунд, но Telegram не должен из-за этого повторно слать
    // тот же апдейт
    res.status(200).json({ ok: true });

    try {

        const msg = update.channel_post;
        const editedMsg = update.edited_channel_post;

        if (editedMsg) {
            await processEditedPost(editedMsg);
            return;
        }

        if (!msg) return;

        const text = msg.caption || msg.text || "";

        if (!text.trim() && !msg.photo) {
            // пустой служебный пост канала — нечего обрабатывать
            return;
        }

        if (msg.media_group_id) {
            await handleAlbumMessage(msg);
            return;
        }

        const image = msg.photo ? await uploadPhoto(msg.photo) : "";
        await processPost(msg, image, allHasVideo(msg));

    } catch (e) {

        console.log("WEBHOOK HANDLER EXCEPTION:", e);
    }
}
