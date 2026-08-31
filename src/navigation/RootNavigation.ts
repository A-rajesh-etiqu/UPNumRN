import { createNavigationContainerRef, useRoute } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export const router = {
  push: (name: string, params?: any) => {
    if (navigationRef.isReady()) {
      let rootName = name;
      let nestedParams = params;
      if (name.startsWith('/tabs/')) {
         rootName = '/tabs';
         nestedParams = { screen: name, params };
      } else if (name.startsWith('/auth/')) {
         rootName = '/auth';
         nestedParams = { screen: name, params };
      }
      navigationRef.navigate(rootName as any, nestedParams as any);
    } else {
      setTimeout(() => router.push(name, params), 100);
    }
  },
  replace: (name: string, params?: any) => {
    if (navigationRef.isReady()) {
      let rootName = name;
      let nestedParams = params;
      if (name.startsWith('/tabs/')) {
         rootName = '/tabs';
         nestedParams = { screen: name, params };
      } else if (name.startsWith('/auth/')) {
         rootName = '/auth';
         nestedParams = { screen: name, params };
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
