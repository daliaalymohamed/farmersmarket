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


// Category validation Schema (for both create and update)
export const categorySchema = (t, isEditMode = false) => yup.object().shape({
  name: yup.object().shape({
    en: yup.string()
          .min(3, t("categoryNameLength"))
          .max(50, t("categoryNameLength"))
          .matches(/^[\u0600-\u065F\u066A-\u06EF\u06FA-\u06FFa-zA-Z0-9 . ]+[\u0600-\u065F\u066A-\u06EF\u06FA-\u06FFa-zA-Z-_0-9 . ]$/, t("categoryNameRegexError"))
          .required(t("categoryNameEnRequired")),
    ar: yup.string()
          .min(3, t("categoryNameLength"))
          .max(50, t("categoryNameLength"))
          .required(t("categoryNameArRequired"))
  }),
  image: yup.mixed()
      .when([], (_, schema) => {
        return !isEditMode // If NOT edit mode (i.e., add mode)
          ? schema.required(t("imageRequired")) // Image is required in add mode
          : schema.nullable(); // Image is optional in edit mode
      })
      .test("file-format", t("invalidImageFormat"), function (value) {
        // Skip validation if no value and in edit mode
        if (!value && isEditMode) {
          return true;
        }
        
        // If it's a File object, validate the format
        if (value instanceof File) {
          const allowedExtensions = /\.(jpe?g|png|gif|webp)$/i;
          return allowedExtensions.test(value.name);
        }
        
        // If it's a string (existing image path), it's valid
        if (typeof value === 'string' && value.length > 0) {
          return true;
        }
        
        // For add mode with no value, let the required validation handle it
        if (!isEditMode && !value) {
          return true; // Let .required() handle this
        }
        
        return false;
      }),
  color: yup.string().matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, t("invalidColorCode")).required(t("colorRequired")),
});


// Product validation Schema (for both create and update)
export const productSchema = (t, isEditMode = false) => yup.object().shape({
  name: yup.object().shape({
    en: yup.string()
          .min(3, t("productNameLength"))
          .max(50, t("productNameLength"))
          .required(t("productNameEnRequired")),
    ar: yup.string()
          .min(3, t("productNameLength"))
          .max(50, t("productNameLength"))
          .required(t("productNameArRequired"))
  }),
  description: yup.object().shape({
    en: yup.string()
          .min(10, t("productDescriptionLength"))
          .max(500, t("productDescriptionLength"))
          .required(t("productDescriptionEnRequired")),
    ar: yup.string()
          .min(10, t("productDescriptionLength"))
          .max(500, t("productDescriptionLength"))
          .required(t("productDescriptionArRequired"))
  }),
  price: yup.number()
    .typeError(t("priceNumber"))
    .min(0, t("priceMin"))
    .required(t("productPriceRequired")),
  stock: yup.number()
    .typeError(t("stockNumber"))
    .min(0, t("stockMin"))
    .required(t("productStockRequired")),
  categoryId: yup.string().required(t("productCategoryRequired")),
  vendorId: yup.string().required(t("productVendorRequired")),
  isActive: yup.boolean().default(true),
  isFeatured: yup.boolean().default(false),
  isOnSale: yup.boolean().default(false),
  salePrice: yup.number()
    .transform(value => (isNaN(value) ? undefined : value))
    .nullable()
    .when('isOnSale', {
      is: true,
      then: schema => schema
        .required(t("productSalePriceRequired"))
        .min(0, t("salePriceMin")),
      otherwise: schema => schema.notRequired()
    }),
  saleStart: yup.date()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .when('isOnSale', {
      is: true,
      then: schema => schema.required(t("saleStartDateRequired")),
      otherwise: (schema) => schema.strip() // ✅ Removes field from validation entirely,
    }),
  saleEnd: yup.date()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .when('isOnSale', {
      is: true,
      then: schema => schema
        .required(t("saleEndDateRequired"))
        .min(yup.ref('saleStart'), t("saleEndAfterStart")),
      otherwise: (schema) => schema.strip() // ✅ Removes field from validation entirely,
    }),
  tags: yup.array()
    .of(
      yup.string()
        .trim()
        .min(2, t("tagMinLength"))
        .max(30, t("tagMaxLength"))
        .matches(/^[a-zA-Z0-9\s\-_&]+$/, t("tagInvalidCharacters"))
    )
    .max(10, t("tagsMaxCount"))
    .test('tags-length-total', t("tagsLengthTotalError"), function(value) {
      if (!Array.isArray(value)) return true;
      
      const totalLength = value.join('').length;
      return totalLength <= 200; // Total characters across all tags
    })
    .default([]),
  image: yup.mixed()
      .when([], (_, schema) => {
        return !isEditMode 
          ? schema.required(t("imageRequired")) // Image is required in add mode
          : schema.nullable(); // Image is optional in edit mode
      })
      .test("file-format", t("invalidImageFormat"), function (value) {
        // Skip validation if no value and in edit mode
        if (!value && isEditMode) {
          return true;
        }
        
        // If it's a File object, validate the format
        if (value instanceof File) {
          const allowedExtensions = /\.(jpe?g|png|gif|webp)$/i;
          return allowedExtensions.test(value.name);
        }
        
        // If it's a string (existing image path), it's valid
        if (typeof value === 'string' && value.length > 0) {
          return true;
        }
        
        // For add mode with no value, let the required validation handle it
        if (!isEditMode && !value) {
          return true; // Let .required() handle this
        }
        
        return false;
      }),
});

// Vendor validation Schema (for both create and update)
export const vendorSchema = (t, isEditMode = false) => yup.object().shape({
  name: yup.string().min(3, t("vendorNameLength")).max(50, t("vendorNameLength")).required(t("vendorNameRequired")),
  countryCode: yup.string().required(t("countryCodeRequired")), 
  contactPhone: yup.string()
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
    }),
  location: yup.string().min(3, t("vendorLocationLength")).max(100, t("vendorLocationLength")),
  about: yup.string().min(10, t("aboutVendorLength")).max(500, t("aboutVendorLength")),
  socialLinks: yup.object().shape({
    facebook: yup.string().url(t("invalidFacebookUrl")),
    instagram: yup.string().url(t("invalidInstagramUrl")),
  })
})

// Shipping Zone validation Schema (for both create and update)
export const shippingZoneSchema = (t) => yup.object().shape({
  name: yup.object().shape({
    en: yup.string()
          .min(3, t("zoneNameLength"))
          .max(50, t("zoneNameLength"))
          .required(t("zoneNameEnRequired")),
    ar: yup.string()
          .min(3, t("zoneNameLength"))
          .max(50, t("zoneNameLength"))
          .required(t("zoneNameArRequired"))
  }),
  country: yup.string().required(t('countryRequired')),
  zipCodes: yup.array().of(yup.string().trim()).min(1, t('atLeastOneZipRequired')),
  cityNames: yup.array().of(
    yup.object().shape({
      en: yup.string().min(2, t('cityNameLength')).max(50, t('cityNameLength')).required(t('cityNameRequired')),
      ar: yup.string().min(2, t('cityNameLength')).max(50, t('cityNameLength')).required(t('cityNameRequired'))
    })
  ),
  shippingFee: yup.number().min(0).required(t('shippingFeeRequired')),
  taxRate: yup.number().min(0).max(1).required(t('taxRateRequired'))
});

// Role validation Schema (for both create and update)
export const roleSchema = (t, isEditMode = false) => yup.object().shape({
  name: yup.string()
            .min(3, t("roleNameLength"))
            .max(50, t("roleNameLength"))
            .required(t("roleNameRequired"))})