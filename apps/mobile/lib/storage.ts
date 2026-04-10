import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'parknear-auth' });

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
