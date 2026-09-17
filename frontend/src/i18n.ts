import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 9 Required Languages
const resources = {
  en: { translation: { appName: "AspireOS Capability & Knowledge Hub" } },
  hi: { translation: { appName: "एस्पायरओएस क्षमता और ज्ञान हब" } }, // Hindi
  ta: { translation: { appName: "ஆஸ்பையர்ஓஎஸ் திறன் மற்றும் அறிவு மையம்" } }, // Tamil
  te: { translation: { appName: "ఆస్పైర్ఓఎస్ సామర్థ్య మరియు జ్ఞాన కేంద్రం" } }, // Telugu
  kn: { translation: { appName: "ಆಸ್ಪೈರ್ಓಎಸ್ ಸಾಮರ್ಥ್ಯ ಮತ್ತು ಜ್ಞಾನ ಕೇಂದ್ರ" } }, // Kannada
  ml: { translation: { appName: "ആസ്പയർഓഎസ് ശേഷി പരിജ്ഞാന കേന്ദ്രം" } }, // Malayalam
  bn: { translation: { appName: "অ্যাসপায়ারওএস ক্ষমতা এবং জ্ঞান হাব" } }, // Bengali
  mr: { translation: { appName: "अस्पायरओएस क्षमता आणि ज्ञान केंद्र" } }, // Marathi
  gu: { translation: { appName: "એસ્પાયરઓએસ ક્ષમતા અને જ્ઞાન હબ" } }, // Gujarati
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
