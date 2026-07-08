import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import ru from './locales/ru/translation.json'
import en from './locales/en/translation.json'
import uz from './locales/uz/translation.json'

i18n
    .use(initReactI18next)
    .init({
        resources: {
            ru: {
                translation: ru,
            },

            en: {
                translation: en,
            },

            uz: {
                translation: uz,
            },
        },

        lng: 'ru',

        fallbackLng: 'ru',

        interpolation: {
            escapeValue: false,
        },
    })

export default i18n