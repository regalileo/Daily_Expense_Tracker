export const formatRupiah = (num) => {
  return "Rp " + num.toLocaleString("id-ID");
};

export const saveToStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getFromStorage = (key, defaultVal = null) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultVal;
};
