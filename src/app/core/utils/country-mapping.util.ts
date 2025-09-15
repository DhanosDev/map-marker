import { COUNTRY_NAMES } from '../constants/countries.constants';

export const getCountryName = (code: string): string => {
  return COUNTRY_NAMES[code] || `Country ${code}`;
};
