import { useMemo } from 'react';
import ruTranslations from '../locales/ru';

export const useTranslation = () => {
  const t = useMemo(() => {
    const translate = (key, defaultValue = key) => {
      const keys = key.split('.');
      let value = ruTranslations;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return defaultValue;
        }
      }
      
      return typeof value === 'string' ? value : defaultValue;
    };
    
    return translate;
  }, []);
  
  return { t };
};

export default useTranslation;