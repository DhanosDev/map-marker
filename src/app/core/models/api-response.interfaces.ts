export interface OpenDataSoftFacetsResponse {
  links: Array<{
    rel: string;
    href: string;
  }>;
  facets: Array<{
    name: string; // "country_code"
    facets: CountryFacet[];
  }>;
}

export interface CountryFacet {
  name: string; // ISO code (e.g., "FR")
  count: number; // Number of postal codes
  state: string; // "displayed"
  value: string; // Same as name (ISO code)
}

export interface OpenDataSoftRecordsResponse {
  total_count: number;
  results: PostalCodeRecord[];
}

export interface PostalCodeRecord {
  country_code: string;
  postal_code: string;
  place_name: string;
  admin_name1: string; // Region/State name
  admin_code1: string; // Region/State code
  admin_name2: string; // Department/Province name
  admin_code2: string; // Department/Province code
  admin_name3: string; // Sub-region name
  admin_code3: string; // Sub-region code
  latitude: number;
  longitude: number;
  accuracy: number; // Precision level
  coordinates: {
    // Duplicate coordinates object ?
    lon: number;
    lat: number;
  };
}

export interface GroupedCitiesResponse {
  total_count: number;
  results: Array<{
    place_name: string;
    postal_count: number;
  }>;
}
