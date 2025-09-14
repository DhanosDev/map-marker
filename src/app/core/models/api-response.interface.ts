export interface OpenDataSoftResponse<T> {
  records: T[];
  facet_groups?: any[];
  parameters: {
    rows: number;
    start: number;
  };
  nhits: number;
}

// Specific facet response interface
export interface CountryFacetResponse {
  facets: Array<{
    name: string;
    count: number;
    state: string;
    path: string;
  }>;
}
