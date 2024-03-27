export interface MLOrder {
  id: number;
  status: string;
  status_detail: any;
  date_created: string;
  date_closed: string;
  pack_id?: string;
  order_items: OrderItem[];
  total_amount: number;
  currency_id: string;
  buyer: Buyer;
  seller: Seller;
  payments: Payment[];
  feedback: Feedback;
  context: Context;
  shipping: Shipping;
  tags: string[];
}

export interface OrderItem {
  item: Item;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

export interface Item {
  id: string;
  title: string;
  variation_id: any;
  variation_attributes: any[];
  seller_sku?: string;
  seller_custom_field?: any[];
  sold_quantity?: number;
  pictures?: any[];
  picture_ids?: any[];
  variations?: any[];
}

export interface Buyer {
  id: string;
  nickname?: string;
  first_name?: string;
  last_name?: string;
}

export interface Seller {
  id: string;
}

export interface Payment {
  id: string;
  transaction_amount: number;
  currency_id: string;
  status: string;
  date_created: any;
  date_last_modified: any;
}

export interface Feedback {
  purchase: any;
  sale: any;
}

export interface Context {
  channel: string;
  site: string;
  flows: number[];
}

export interface Shipping {
  id: number;
}

export interface MLOrderItems {
  id?: string;
  productId?: string;
  finalProductId?: string;
  variantOptions: VariantOptions;
  qtyOrdered: number;
  qtyInvoiced: number;
  qtyShipped: number;
  shippable: boolean;
  taxes: Tax[];
  details: Details;
  totals: Totals;
  additionalInformation: AdditionalInformation;
}

export interface VariantOptions {}

export interface Tax {}

export interface Details {}

export interface Totals {}

export interface AdditionalInformation {}

export interface Cart {
  id: string;
  status: string; //'filling', 'filled', 'released'
  status_detail: string | null;
  date_created: string;
  last_updated: string;
  family_pack_id: string | null;
  buyer: Buyer;
  shipment: Shipment;
  orders: OrderIds[];
}

export interface Shipment {
  id: string;
}

export interface OrderIds {
  id: string;
}

export type Product = {
  id: string;
  type?: string;
  qty?: number;
  price?: number;
  createdAt: string;
  updatedAt?: string;
  attributes: StretoAttribute;
  scopedAttributes?: ScopedAttributes;
  attributeSets?: string[];
  attributeSetNames?: string[];
  variants?: Product[];
};

export type StretoAttribute = {
  id: string;
  name?: string;
  title?: string;
  sku: string;
  brand?: string;
  urlKey?: string;
  mvb_cost?: string;
  mvb_source_rule?: string;
  enabled?: boolean;
  images?: Image[];
  item_condition?: string;
  model?: string;
  description?: string;
  variantOptions?: any;
  validations?: any;
  [propName: string]: any;
};

type ScopedAttributes = {};

type Image = {
  id: string;
  roles: string[];
};

export type Category = {
  id: string;
  name: string;
  children_categories?: Category[];
  path_from_root?: {
    id?: string;
    name?: string;
  }[];
};

export type MeliAttribute = {
  id: string;
  name?: string;
  value_type?: string;
  values?: {
    id: string;
    name: string;
  }[];
  hint?: string;
  allowed_units?: {
    id: string;
    name: string;
  }[];
  default_unit?: string;
  tags: {
    allow_variations?: boolean;
    required?: boolean;
  };
};

export type AttributeSet = {
  name: string;
  attributes: string;
};
export interface Reviews {
  paging: Paging;
  reviews: Review[];
  rating_average: number;
  rating_levels: RatingLevels;
  helpful_reviews: HelpfulReviews;
  attributes: any[];
}

export interface Paging {}

export interface Review {
  body?: any;
  id?: number;
  reviewable_object?: ReviewableObject;
  date_created?: string;
  status?: string;
  title?: string;
  content?: string;
  rate?: number;
  valorization?: number;
  likes?: number;
  dislikes?: number;
  reviewer_id?: number;
  buying_date?: string;
  relevance?: number;
  forbidden_words?: number;
}

export interface ReviewableObject {}

export interface RatingLevels {
  one_star: number;
  two_star: number;
  three_star: number;
  four_star: number;
  five_star: number;
}

export interface HelpfulReviews {}

export interface ProductStretoML {
  productId: string;
  MLId: string;
}

export interface Resource {
  _id?: string;
  topic: string;
  resource: string;
  user_id?: number;
  application_id?: number;
  sent?: string;
  attempts?: number;
  received?: string;
  actions?: string[];
}
