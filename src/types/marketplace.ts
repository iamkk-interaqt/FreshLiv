export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type CustomerLocation = Partial<Coordinates> & {
  locality?: string;
  postalCode?: string;
};

export type DairywalaProfile = {
  id: string;
  businessName: string;
  phone: string | null;
  locality: string;
  familiesServed: number | null;
  yearsInBusiness: number | null;
  profileAvatar: string;
};

export type DairywalaProductMatch = {
  id: string;
  dairywalaId: string;
  name: string;
  description: string | null;
  productCategory: string | null;
  productVariant: string | null;
  productType: string | null;
  usageTypes: string[];
  milkBreed: string | null;
  bulkOrderEnabled: boolean;
  quantityValue: number | null;
  quantityUnit: string | null;
  price: number;
};

export type DairywalaSummary = {
  id: string;
  businessName: string;
  locality: string;
  phone?: string | null;
  familiesServed?: number | null;
  yearsInBusiness?: number | null;
  profileAvatar?: string;
  ratingAverage?: number;
  ratingCount?: number;
  morningSlotAvailable: boolean;
  eveningSlotAvailable: boolean;
};

export type DiscoveryResult = {
  location: CustomerLocation;
  dairywalas: DairywalaSummary[];
};