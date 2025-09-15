export interface Country {
  code: string; // ISO code (from facet.name)
  name: string; // Human readable name (mapped)
  count: number; // Number of postal codes (from facet.count)
}

export interface PostalCode {
  postalCode: string;
  placeName: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  // Administrative divisions
  region: string; // admin_name1
  regionCode: string; // admin_code1
  department: string; // admin_name2
  departmentCode: string; // admin_code2
  subRegion: string; // admin_name3
  subRegionCode: string; // admin_code3
  accuracy: number;
}

export interface City {
  name: string; // place_name from API
  postalCount: number; // count from grouping query
  countryCode: string; // for reference
}
