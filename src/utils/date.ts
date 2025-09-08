export const formatDateJakarta = (date: Date) =>
  new Date(date).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "short",
    timeStyle: "medium"
  });
