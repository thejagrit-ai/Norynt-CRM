// src/common/i18n/backend-translations.ts
// Enterprise localization dictionary for backend exceptions and system messages.
// Defaults to English (en). Supports Turkish (tr), Hindi (hi), Spanish (es).

export type Locale = 'en' | 'tr' | 'hi' | 'es';

export const BACKEND_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: {
    'errors.forbidden': 'You do not have permission to perform this action.',
    'errors.unauthorized':
      'Authentication required. Please log in to continue.',
    'errors.notFound': 'Requested resource was not found.',
    'errors.badRequest': 'Invalid request parameters.',
    'errors.validationError': 'Validation error occurred.',
    'errors.tooManyRequests': 'Too many requests. Please try again later.',
    'errors.internalError': 'An unexpected server error occurred.',
    'errors.invalidCredentials': 'Invalid email or password.',
    'errors.userDisabled': 'This user account has been disabled.',
    'errors.invoiceAlreadyPaid': 'Invoice is already fully paid.',
    'errors.invoiceDraftOnly': 'Only draft invoices can be modified.',
    'errors.crlfInjection': 'Invalid newline character detected.',
    'errors.providerNotConnected': 'Payment gateway is not connected.',
  },
  tr: {
    'errors.forbidden': 'Bu işlemi gerçekleştirme yetkiniz yok.',
    'errors.unauthorized': 'Kimlik doğrulaması gerekiyor. Lütfen giriş yapın.',
    'errors.notFound': 'İstenen kaynak bulunamadı.',
    'errors.badRequest': 'Geçersiz istek parametreleri.',
    'errors.validationError': 'Doğrulama hatası oluştu.',
    'errors.tooManyRequests':
      'Çok fazla istek yapıldı. Lütfen daha sonra tekrar deneyin.',
    'errors.internalError': 'Beklenmeyen bir sunucu hatası oluştu.',
    'errors.invalidCredentials': 'Geçersiz e-posta veya şifre.',
    'errors.userDisabled': 'Bu kullanıcı hesabı devre dışı bırakılmış.',
    'errors.invoiceAlreadyPaid': 'Fatura zaten tam ödenmiş.',
    'errors.invoiceDraftOnly': 'Yalnızca taslak faturalar düzenlenebilir.',
    'errors.crlfInjection': 'Geçersiz satır sonu karakteri algılandı.',
    'errors.providerNotConnected': 'Ödeme sağlayıcısı bağlı değil.',
  },
  hi: {
    'errors.forbidden': 'आपको यह कार्य करने की अनुमति नहीं है।',
    'errors.unauthorized':
      'प्रमाणीकरण आवश्यक है। कृपया जारी रखने के लिए लॉगिन करें।',
    'errors.notFound': 'अनुरोधित संसाधन नहीं मिला।',
    'errors.badRequest': 'अमान्य अनुरोध पैरामीटर।',
    'errors.validationError': 'सत्यापन त्रुटि उत्पन्न हुई।',
    'errors.tooManyRequests':
      'बहुत सारे अनुरोध। कृपया कुछ समय बाद पुनः प्रयास करें।',
    'errors.internalError': 'सर्वर में अप्रत्याशित त्रुटि उत्पन्न हुई।',
    'errors.invalidCredentials': 'अमान्य ईमेल या पासवर्ड।',
    'errors.userDisabled': 'यह उपयोगकर्ता खाता अक्षम कर दिया गया है।',
    'errors.invoiceAlreadyPaid': 'चालान का पूर्ण भुगतान पहले ही हो चुका है।',
    'errors.invoiceDraftOnly':
      'केवल ड्राफ्ट चालान को ही संशोधित किया जा सकता है।',
    'errors.crlfInjection': 'अमान्य वर्ण पाया गया।',
    'errors.providerNotConnected': 'भुगतान गेटवे जुड़ा नहीं है।',
  },
  es: {
    'errors.forbidden': 'No tienes permiso para realizar esta acción.',
    'errors.unauthorized':
      'Autenticación requerida. Inicie sesión para continuar.',
    'errors.notFound': 'El recurso solicitado no fue encontrado.',
    'errors.badRequest': 'Parámetros de solicitud no válidos.',
    'errors.validationError': 'Se produjo un error de validación.',
    'errors.tooManyRequests':
      'Demasiadas solicitudes. Inténtalo de nuevo más tarde.',
    'errors.internalError': 'Ocurrió un error inesperado en el servidor.',
    'errors.invalidCredentials': 'Correo electrónico o contraseña no válidos.',
    'errors.userDisabled': 'Esta cuenta de usuario ha sido deshabilitada.',
    'errors.invoiceAlreadyPaid': 'La factura ya está totalmente pagada.',
    'errors.invoiceDraftOnly': 'Sólo se pueden modificar facturas en borrador.',
    'errors.crlfInjection': 'Carácter de nueva línea no válido detectado.',
    'errors.providerNotConnected': 'La pasarela de pago no está conectada.',
  },
};

export function resolveLocale(acceptLanguage?: string | string[]): Locale {
  if (!acceptLanguage) return 'en';
  const raw = Array.isArray(acceptLanguage)
    ? acceptLanguage[0]
    : acceptLanguage;
  const lang = raw.split(',')[0]?.split('-')[0]?.trim().toLowerCase();
  if (lang === 'tr') return 'tr';
  if (lang === 'hi') return 'hi';
  if (lang === 'es') return 'es';
  return 'en';
}

export function translateBackend(
  key: string,
  locale: Locale = 'en',
  fallback?: string,
): string {
  const table = BACKEND_TRANSLATIONS[locale] || BACKEND_TRANSLATIONS.en;
  return table[key] || BACKEND_TRANSLATIONS.en[key] || fallback || key;
}

// Legacy phrase mapper to ensure zero Turkish leaks when non-Turkish is requested
export const TURKISH_PHRASE_MAP: Record<string, string> = {
  'bu işlem için yetkiniz yok.': 'errors.forbidden',
  'bu işlemi gerçekleştirme yetkiniz yok.': 'errors.forbidden',
  'yetkisiz erişim.': 'errors.unauthorized',
  'kimlik doğrulaması gerekiyor.': 'errors.unauthorized',
  'fatura bulunamadı.': 'errors.notFound',
  'kullanıcı bulunamadı.': 'errors.notFound',
  'kaynak bulunamadı.': 'errors.notFound',
  'geçersiz e-posta veya parola.': 'errors.invalidCredentials',
  'geçersiz e-posta veya şifre.': 'errors.invalidCredentials',
  'fatura zaten tam ödenmiş.': 'errors.invoiceAlreadyPaid',
  'yalnızca taslak faturalar düzenlenebilir.': 'errors.invoiceDraftOnly',
  'geçersiz karakter (crlf).': 'errors.crlfInjection',
  'sağlayıcı bağlı değil': 'errors.providerNotConnected',
};
