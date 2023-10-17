export const getOrgId = (auth) => {
  return auth.user?.organizationId;
};

export const getRoles = (auth) => {
  return auth.user?.roles;
};

export const isUserLoaded = (auth) => {
  return !!auth?.user?.isLoaded;
};
