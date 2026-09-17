export const formatDate = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};
