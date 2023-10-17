export const encrypt = (plainData) => {
  try {
    const iv = Math.random().toString(36).substring(2, 6);
    const plainString = JSON.stringify(plainData) + iv;
    return typeof window === 'undefined'
      ? Buffer.from(plainString).toString('base64')
      : window.btoa(plainString);
  } catch (e) {
    return null;
  }
};

export const decrypt = (encryptedString) => {
  try {
    const plainString =
      typeof window === 'undefined'
        ? Buffer.from(encryptedString, 'base64').toString()
        : window.atob(encryptedString);
    return JSON.parse(plainString.slice(0, -4));
  } catch (e) {
    return null;
  }
};
