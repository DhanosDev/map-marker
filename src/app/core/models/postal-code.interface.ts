export interface PostalCode {
  fields: {
    postal_code: string;
    latitude: number;
    longitude: number;
    place_name: string;
    country_code?: string;
  };
}
