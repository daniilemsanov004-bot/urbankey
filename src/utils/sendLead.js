export const sendLead = async ({ source, data, captchaToken, honeypot, skipCrm }) => {

    const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            source,
            data,
            captchaToken,
            company: honeypot || "",
            skipCrm: Boolean(skipCrm)
        })
    });

    if (!response.ok) {

        let message = "Request failed";

        try {
            const body = await response.json();
            message = body?.error || message;
        } catch {
        }

        throw new Error(message);
    }

    return response.json();
};
