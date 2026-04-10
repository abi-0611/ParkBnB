import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'parknear-auth' });

/** Last known GPS for faster cold start (seeker map). */
export const geoMmkv = createMMKV({ id: 'parknear-geo' });

export const mmkvStorage = {
  getItem: (key: string) => Promise.resolve(storage.getString(key) ?? null),
  setItem: (key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    storage.remove(key);
    return Promise.resolve();
  },
};

export const onboardingStorage = {
  getDone(userId: string) {
    return storage.getBoolean(`onboarding:${userId}`) === true;
  },
  setDone(userId: string) {
    storage.set(`onboarding:${userId}`, true);
  },
};
