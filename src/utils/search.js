
export const normalizeText = (str) =>
    String(str || "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();


const levenshtein = (a, b) => {

    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const prev = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;

    for (let i = 1; i <= a.length; i++) {

        let prevDiag = prev[0];
        prev[0] = i;

        for (let j = 1; j <= b.length; j++) {

            const temp = prev[j];
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;

            prev[j] = Math.min(
                prev[j] + 1,
                prev[j - 1] + 1,
                prevDiag + cost
            );

            prevDiag = temp;
        }
    }

    return prev[b.length];
};


const scoreWordAgainstField = (word, fieldWords, fieldText) => {

    if (!word) return 0;

    if (fieldText.includes(word)) {

        const startsWord = fieldWords.some((w) => w.startsWith(word));
        return startsWord ? 3 : 2;
    }

    if (word.length < 3) return 0;

    let best = 0;

    for (const fw of fieldWords) {

        if (Math.abs(fw.length - word.length) > 2) continue;

        const dist = levenshtein(word, fw);
        const maxAllowed = word.length <= 4 ? 1 : 2;

        if (dist <= maxAllowed) {
            const candidate = maxAllowed + 1 - dist;
            if (candidate > best) best = candidate;
        }
    }

    return best * 0.6; // опечатка ценится ниже точного совпадения
};


export const fuzzyScore = (query, fields) => {

    const q = normalizeText(query);
    if (!q) return 0;

    const words = q.split(" ").filter(Boolean);
    const normalizedFields = fields
        .map(normalizeText)
        .filter(Boolean);

    let total = 0;

    for (const word of words) {

        let bestForWord = 0;

        for (const fieldText of normalizedFields) {

            const fieldWords = fieldText.split(" ");
            const s = scoreWordAgainstField(word, fieldWords, fieldText);

            if (s > bestForWord) bestForWord = s;
        }

        if (bestForWord === 0) return 0;

        total += bestForWord;
    }

    return total;
};


export const highlightSegments = (text, query) => {

    const raw = String(text || "");
    const words = normalizeText(query).split(" ").filter((w) => w.length > 1);

    if (!words.length) return [{ text: raw, match: false }];

    const pattern = words
        .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");

    const re = new RegExp(`(${pattern})`, "gi");
    const parts = raw.split(re);

    return parts
        .filter((p) => p !== undefined && p !== "")
        .map((part) => ({
            text: part,
            match: words.includes(normalizeText(part))
        }));
};
