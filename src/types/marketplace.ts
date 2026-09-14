export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type CustomerLocation = Partial<Coordinates> & {
  locality?: string;
  postalCode?: string;
};

export type DairywalaSummary = {
  id: string;
  businessName: string;
  locality: string;
  ratingAverage?: number;
  ratingCount?: number;
  morningSlotAvailable: boolean;
  eveningSlotAvailable: boolean;
};

export type DiscoveryResult = {
  location: CustomerLocation;
  dairywalas: DairywalaSummary[];
};
