import { createNavigationContainerRef, useRoute } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export const router = {
  push: (name: string | { pathname: string; params?: any }, params?: any) => {
    if (navigationRef.isReady()) {
      let routeName = typeof name === 'object' ? name.pathname : name;
      let routeParams = typeof name === 'object' ? name.params : params;
      let rootName = routeName;
      let nestedParams = routeParams;
      if (routeName.startsWith('/tabs/')) {
         rootName = '/tabs';
         nestedParams = { screen: routeName, params: routeParams };
      } else if (routeName.startsWith('/auth/')) {
         rootName = '/auth';
         nestedParams = { screen: routeName, params: routeParams };
      }
      navigationRef.navigate(rootName as any, nestedParams as any);
    } else {
      setTimeout(() => router.push(name, params), 100);
    }
  },
  replace: (name: string | { pathname: string; params?: any }, params?: any) => {
    if (navigationRef.isReady()) {
      let routeName = typeof name === 'object' ? name.pathname : name;
      let routeParams = typeof name === 'object' ? name.params : params;
      let rootName = routeName;
      let nestedParams = routeParams;
      if (routeName.startsWith('/tabs/')) {
         rootName = '/tabs';
         nestedParams = { screen: routeName, params: routeParams };
      } else if (routeName.startsWith('/auth/')) {
         rootName = '/auth';
         nestedParams = { screen: routeName, params: routeParams };
      }
      navigationRef.reset({ index: 0, routes: [{ name: rootName, params: nestedParams }] });
    } else {
      setTimeout(() => router.replace(name, params), 100);
    }
  },
  back: () => {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  },
};

export function useLocalSearchParams<T extends Record<string, string>>(): Partial<T> {
  const route = useRoute();
  return (route.params || {}) as Partial<T>;
}

export function usePathname(): string {
  const route = useRoute();
  return route.name;
}
