import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  createContext,
} from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import {
  useAccount,
  findOrCreateUser,
  getAccountOrganizations,
  updateAuth0User,
  updateOrganizationOverride,
} from './api';
import router from 'next/router';
import PageLoader from './../components/PageLoader';
import analytics from '@util/analytics';
import { toast } from 'react-toastify';
import { getRoles, isUserLoaded } from '@helpers/auth';
import { createCookie, getCookieValue } from '@helpers/utils';
import { isEqual } from 'lodash';

// Whether to merge user data from database into auth.user
const MERGE_DB_USER = true;

const authContext = createContext();

// Context Provider component that wraps your app and makes auth object
// available to any child component that calls the useAuth() hook.
export function ProvideAuth({ children }) {
  const auth = useProvideAuth();
  return (
    <>
      {auth.isLoading && <PageLoader />}

      {!auth.isLoading && (
        <authContext.Provider value={auth}>{children}</authContext.Provider>
      )}
    </>
  );
}

// Hook that enables any component to subscribe to auth state
export const useAuth = () => {
  return useContext(authContext);
};

// Provider hook that creates auth object and handles state
function useProvideAuth() {
  const { user: authUser, isLoading: authUserLoading } = useUser();

  // Store auth user object
  const [finalUser, setFinalUser] = useState(null);
  const [preUser, setPreUser] = useState(null);

  // Format final user object and merge extra data from database
  const dbUser = usePrepareUser(preUser);

  const handleSelectOrganization = (orgId) => {
    updateAuth0User({
      org_id_override: orgId,
    })
      .then((res) => {
        createCookie('appSession', '', 0);
        toast.success(`Selected organization updated. Reloading the page.`, {
          theme: 'colored',
        });
        setTimeout(() => {
          window.location.reload();
        }, 4000);
      })
      .catch((err) => {
        toast.error('Error changing selected org.', {
          theme: 'colored',
        });
        console.error(`error updating selected org`, err);
      });
  };

  const getSelectedOrganization = () => {
    return authUser.org_id_override || dbUser.organizationId;
  };

  useEffect(() => {
    if (!dbUser || isEqual(dbUser, finalUser)) return;
    setFinalUser(dbUser);
  }, [dbUser]);

  useEffect(() => {
    if (authUserLoading) return;
    if (!authUserLoading && typeof authUser == 'undefined')
      router.push('/api/auth/login');

    if (authUser) {
      if (!authUser.uid) authUser.uid = authUser.sub;
      if (authUser.uid.indexOf('|') >= 0) {
        //remove all componenents of the uid except the id.
        authUser.uid = authUser.uid.substring(
          authUser.uid.lastIndexOf('|') + 1,
        );
        if (!authUser.email) {
          //email is the last part of the identifier
          authUser.email = authUser.uid.substring(
            authUser.uid.lastIndexOf('|') + 1,
          );
        }
      }

      const checkUserFromExtraDB = async () => {
        return await findOrCreateUser(
          authUser.uid,
          null,
          authUser.email,
          authUser,
        );
      };

      checkUserFromExtraDB()
        .then((res) => {
          if (res.success && res.data.status) {
            setPreUser(authUser);
            analytics.identify(authUser.uid);
          } else {
            router.push('/api/auth/logout');
          }
        })
        .catch((err) => {
          console.log(err);
          router.push('/api/auth/logout');
        });
    } else {
      createCookie('orgId', '');
      setPreUser(null);
    }
  }, [authUser, authUserLoading]);

  return {
    user: finalUser,
    isLoading: !finalUser,
    setUser: setFinalUser,
    getSelectedOrganization,
    selectOrganization: handleSelectOrganization,
  };
}

// A Higher Order Component for requiring authentication
export const requireAuth = (Component, needEmailVerification = true) => {
  return function RequireAuth(props) {
    // Get authenticated user
    const auth = useAuth();

    useEffect(() => {
      // Redirect if not signed in
      if (auth.user === false) {
        router.replace('/api/auth/login');
      } else if (
        auth.user.email_verified === false &&
        needEmailVerification === true
      ) {
        router.replace('/verify-email');
      }
    }, [auth.user]);

    // Show loading indicator
    // We're either loading (user is null) or we're about to redirect (user is false)
    if (
      (auth.user?.email_verified === true ||
        (auth.user.providerData && auth.user.providerData.length > 0)) &&
      !isUserLoaded(auth)
    ) {
      return <PageLoader />;
    }

    // Render component now that we have user
    return <Component {...props} />;
  };
};

export const requireAdmin = (Component) => {
  return function RequireAdmin(props) {
    // Get authenticated user
    const auth = useAuth();

    useEffect(() => {
      // Redirect if not signed in
      if (auth.user === false || !isAdmin(auth)) {
        router.replace('/api/auth/login');
        return <></>;
      }
    }, [auth.user]);

    // Show loading indicator
    // We're either loading (user is null) or we're about to redirect (user is false)
    if (!isUserLoaded(auth)) {
      return <PageLoader />;
    }

    // Render component now that we have user
    return <Component {...props} />;
  };
};

// Check if given auth is an admin.
export const isAdmin = (auth) => {
  return auth && auth.user && auth.user.email?.indexOf('@optiversal.com') > 0;
};

export const requireRoles = (Component, roles) => {
  return function RequireRoles(props) {
    // Get authenticated user
    const auth = useAuth();

    useEffect(() => {
      // Redirect if not signed in
      if (auth.user === false) {
        router.replace('/api/auth/login');
        return <></>;
      }
      if (
        isUserLoaded(auth) &&
        roles !== null &&
        !rolesMatch(roles, getRoles(auth))
      ) {
        router.replace('/');
        return <></>;
      }
    }, [auth.user]);

    // Show loading indicator
    // We're either loading (user is null) or we're about to redirect (user is false)
    if (!isUserLoaded(auth)) {
      return <PageLoader />;
    }

    // Render component now that we have user
    return <Component {...props} />;
  };
};

export const rolesMatch = (pageRoles, userRoles) => {
  const array = [
    ...Array.from(new Set(pageRoles)),
    ...Array.from(new Set(userRoles)),
  ];
  return new Set(array).size !== array.length;
};

// Format final user object and merge extra data from database
function usePrepareUser(user) {
  // Fetch extra data from database (if enabled and auth user has been fetched)
  const { refetch: refetchUser, ...userDbQuery } = useAccount();
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    if (user) {
      refetchUser();
      // Get Organizations
      getAccountOrganizations(user.uid).then(({ organizations }) => {
        setOrganizations(organizations);
      });
    }
  }, [user, refetchUser]);

  // Memoize so we only create a new object if user or userDbQuery changes
  return useMemo(() => {
    // Return if auth user is null (loading) or false (not authenticated)
    if (!user) return user;
    // Data we want to include from auth user object
    let providerId = user.sub;
    if (providerId.indexOf('|') >= 0) {
      //use everything up to the user ID as the provider ID
      providerId = providerId.substring(0, providerId.indexOf('|'));
    }

    const providerName = allProviders.find((p) => p.id === providerId).name;
    const providers = [providerName];

    let finalUser = {
      ...user,
      // User's auth providers
      providers: providers,
    };

    // If merging user data from database is enabled ...
    if (MERGE_DB_USER) {
      switch (userDbQuery.status) {
        case 'loading':
          // Return null user so auth is considered loading until we have db data to merge
          return null;
        case 'error':
          // Log query error to console
          console.error(userDbQuery.error);
          return null;
        case 'success':
          // If user data doesn't exist we assume this means user just signed up and the createUser
          // function just hasn't completed. We return null to indicate a loading state.
          if (userDbQuery.data === null) return null;
          // Merge user data from database into finalUser object
          finalUser.organizations = organizations;
          if (
            userDbQuery?.data?.account?.name &&
            finalUser.name !== userDbQuery.data.account.name
          ) {
            updateAuth0User({
              name: userDbQuery.data.account.name,
            });
          }
          finalUser = {
            ...finalUser,
            ...userDbQuery?.data?.account,
            isLoaded: true,
          };

          break;
        default:
          return null;
      }
    }
    return finalUser;
  }, [user, userDbQuery, organizations]);
}

const allProviders = [
  {
    id: 'auth0',
    name: 'password',
  },
  {
    id: 'google-oauth2',
    name: 'google',
  },
  {
    id: 'oidc',
    name: 'oidc',
  },
];

export const sendNoPermissionResponse = (res) =>
  res.status(403).send({
    status: 'error',
    message: "You don't have permission to call this endpoint",
  });
