import * as yup from "yup";
// frontend validation
// Validation Schema using Yup
export const loginSchema = (t) => yup.object().shape({
    email: yup.string().email(t("invalidEmail")).required(t("emailRequired")),
    password: yup.string().min(8, t("passwordLength")).max(20, t("passwordLength")).required(t("passwordRequired")),
});

export const registerSchema = (t) => yup.object().shape({
    firstName: yup.string()
      .min(3, t("nameLength"))
      .max(30, t("nameLength"))
      .matches(/^[\u0600-\u065F\u066A-\u06EF\u06FA-\u06FFa-zA-Z0-9 . ]+[\u0600-\u065F\u066A-\u06EF\u06FA-\u06FFa-zA-Z-_0-9 . ]$/, t("nameRegexError"))
      .required(t("nameRequired")),
    lastName: yup.string()
      .min(3, t("nameLength"))
      .max(30, t("nameLength"))
      .matches(/^[\u0600-\u065F\u066A-\u06EF\u06FA-\u06FFa-zA-Z0-9 . ]+[\u0600-\u065F\u066A-\u06EF\u06FA-\u06FFa-zA-Z-_0-9 . ]$/, t("nameRegexError"))
      .required(t("nameRequired")),
    email: yup.string().email(t("invalidEmail")).required(t("emailRequired")),
    password: yup.string()
      .min(8, t("passwordLength"))
      .max(20, t("passwordLength"))
      .matches(/^(?=.*[\w])(?=.*[\W])[\w\W]{8,}$/, t("passwordRegexError"))
      .required(t("passwordRequired")),  
    phoneNumber: yup.string()
      .required(t("phoneNumberRequired"))
      .test("valid-phone", t("phoneNumberRegex"), (value, context) => {
        const countryCode = context.parent.countryCode; // Get selected country code

        const phoneRegexMap = {
          "+20": /^01[0125][0-9]{8}$/, // Egypt
          "+1": /^\d{10}$/, // USA
          "+44": /^\d{10}$/, // UK
          "+91": /^[6789]\d{9}$/, // India
          // Add more countries if needed
        };

        const regex = phoneRegexMap[countryCode] || /^[0-9]+$/; // Default fallback
        return regex.test(value);
      }),
});