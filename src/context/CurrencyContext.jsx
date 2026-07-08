import { createContext, useContext, useEffect, useState } from "react";

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {

    const [currency, setCurrency] = useState(
        () => localStorage.getItem("currency") || "UZS"
    );

    useEffect(() => {
        localStorage.setItem("currency", currency);
    }, [currency]);

    const toggleCurrency = () => {
        setCurrency(prev => (prev === "UZS" ? "USD" : "UZS"));
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, toggleCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);
