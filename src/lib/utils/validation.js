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

// Profile update validation schema
export const profileUpdateSchema = (t) => yup.object().shape({
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
  phoneNumber: yup.string()
    .required(t("phoneNumberRequired"))
    .test("valid-phone", t("phoneNumberRegex"), (value, context) => {
      const countryCode = context.parent.countryCode;
      const phoneRegexMap = {
        "+20": /^01[0125][0-9]{8}$/, // Egypt
        "+1": /^\d{10}$/, // USA
        "+44": /^\d{10}$/, // UK
        "+91": /^[6789]\d{9}$/, // India
      };
      const regex = phoneRegexMap[countryCode] || /^[0-9]+$/;
      return regex.test(value);
    })
});

// Address validation schema (for both create and update)
export const addressSchema = (t) => yup.object().shape({
  street: yup.string()
    .min(3, t("streetLength"))
    .max(100, t("streetLength"))
    .required(t("streetRequired")),
  city: yup.string()
    .min(2, t("cityLength"))
    .max(50, t("cityLength"))
    .required(t("cityRequired")),
  state: yup.string()
    .min(2, t("stateLength"))
    .max(50, t("stateLength"))
    .required(t("stateRequired")),
  zipCode: yup.string()
    .min(3, t("zipCodeLength"))
    .max(20, t("zipCodeLength"))
    .required(t("zipCodeRequired")),
  country: yup.string()
    .min(2, t("countryLength"))
    .max(50, t("countryLength"))
    .required(t("countryRequired")),
  isDefaultShipping: yup.boolean(),
  isDefaultBilling: yup.boolean(),
});
