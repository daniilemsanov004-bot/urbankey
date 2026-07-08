import "dotenv/config";

// Проверяем оба ключа локально — ничего никуда не отправляется,
// просто декодируем payload JWT (это не шифрование, а base64 — так
// устроен любой JWT, раскодировать его может кто угодно, просто зная
// сам токен, это не секретная операция).

function decodeRole(name, token) {

    if (!token) {
        console.log(`${name}: ⛔ не задан в .env`);
        return;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
        console.log(`${name}: ⚠️ не похоже на JWT (нет трёх частей через точку)`);
        return;
    }

    try {

        const payloadJson = Buffer.from(parts[1], "base64").toString("utf8");
        const payload = JSON.parse(payloadJson);

        console.log(`${name}: role = "${payload.role}", ref = "${payload.ref}"`);

    } catch (e) {

        console.log(`${name}: ⚠️ не удалось раскодировать (${e.message})`);
    }
}

console.log("--- Проверка ключей Supabase ---\n");

decodeRole("VITE_SUPABASE_KEY   ", process.env.VITE_SUPABASE_KEY);
decodeRole("SUPABASE_SERVICE_KEY", process.env.SUPABASE_SERVICE_KEY);

console.log("\nОжидается: у VITE_SUPABASE_KEY role = \"anon\", у SUPABASE_SERVICE_KEY role = \"service_role\".");
console.log("Если у обоих одинаковый role — значит в .env реально вписан один и тот же ключ дважды.");
