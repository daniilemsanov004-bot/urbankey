
export const USD_TO_UZS_RATE = 12650;

const UZS_MARKERS = /сум|so'm|som|uzs/i;
const USD_MARKERS = /\$|usd/i;

export const parsePrice = (raw) => {
    if (!raw) return null;

    const str = String(raw).trim();
    if (!str) return null;

    const digits = str.replace(/[^\d]/g, "");
    if (!digits) return null;

    const amount = Number(digits);
    if (!amount) return null;

    let currency = null;

    if (USD_MARKERS.test(str)) currency = "USD";
    else if (UZS_MARKERS.test(str)) currency = "UZS";
    else {
        currency = amount >= 10_000_000 ? "UZS" : "USD";
    }

    return { amount, currency };
};

const formatNumber = (value) => Math.round(value).toLocaleString("ru-RU");

export const formatPriceIn = (raw, displayCurrency) => {
    const parsed = parsePrice(raw);

    if (!parsed) return raw || "—";

    let { amount, currency } = parsed;

    if (currency !== displayCurrency) {
        amount = currency === "USD"
            ? amount * USD_TO_UZS_RATE
            : amount / USD_TO_UZS_RATE;
    }

    return displayCurrency === "USD"
        ? `$${formatNumber(amount)}`
        : `${formatNumber(amount)} UZS`;
};
