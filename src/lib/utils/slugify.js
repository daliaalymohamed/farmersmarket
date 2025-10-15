export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const generateUniqueSlug = async (Model, text, excludeId = null) => {
  const baseSlug = slugify(text);
  let slug = baseSlug;
  let counter = 1;
  
  const query = { slug };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  while (await Model.findOne(query)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};