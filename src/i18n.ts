import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation strings
const resources = {
  en: {
    translation: {
      "Theme & Language": "Theme & Language",
      "Sidebar Background": "Sidebar Background",
      "Header Background": "Header Background",
      "System App Theme": "System App Theme",
      "Select Language": "Select Language",
      "Save Settings": "Save Settings",
      "Dashboard": "Dashboard",
      "Settings": "Settings",
      // Add more standard english strings that might be translated
      "English": "English",
      "Hausa": "Hausa",
      "Arabic": "Arabic",
      "Log out": "Log out"
    }
  },
  ha: {
    translation: {
      "Theme & Language": "Jigo & Harshe",
      "Sidebar Background": "Bangon Gefen Allon",
      "Header Background": "Bangon Sama",
      "System App Theme": "Jigon Tsarin Manhaja",
      "Select Language": "Zaɓi Harshe",
      "Save Settings": "Ajiye Saituna",
      "Dashboard": "Allon Tsari",
      "Settings": "Saituna",
      "English": "Turanci",
      "Hausa": "Hausa",
      "Arabic": "Larabci",
      "Log out": "Fita"
    }
  },
  ar: {
    translation: {
      "Theme & Language": "السمة واللغة",
      "Sidebar Background": "خلفية الشريط الجانبي",
      "Header Background": "خلفية الرأس",
      "System App Theme": "سمة تطبيق النظام",
      "Select Language": "اختر اللغة",
      "Save Settings": "حفظ الإعدادات",
      "Dashboard": "لوحة القيادة",
      "Settings": "الإعدادات",
      "English": "إنجليزي",
      "Hausa": "الهوسا",
      "Arabic": "عربي",
      "Log out": "تسجيل خروج"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
