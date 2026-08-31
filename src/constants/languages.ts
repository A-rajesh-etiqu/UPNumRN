export interface Language {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
}

export const LANGUAGES: Language[] = [
    {
        code: "en",
        name: "English",
        nativeName: "English",
        flag: "🇬🇧",
    },
    {
        code: "ta",
        name: "Tamil",
        nativeName: "தமிழ்",
        flag: "🇮🇳",
    },
    {
        code: "hi",
        name: "Hindi",
        nativeName: "हिन्दी",
        flag: "🇮🇳",
    },
    {
        code: "te",
        name: "Telugu",
        nativeName: "తెలుగు",
        flag: "🇮🇳",
    },
    {
        code: "kn",
        name: "Kannada",
        nativeName: "ಕನ್ನಡ",
        flag: "🇮🇳",
    },
    {
        code: "ml",
        name: "Malayalam",
        nativeName: "മലയാളം",
        flag: "🇮🇳",
    },
];

/**
 * Returns language by code
 */
export const getLanguageByCode = (code: string) =>
    LANGUAGES.find(language => language.code === code);

/**
 * Default language
 */
export const DEFAULT_LANGUAGE = LANGUAGES[0];