export interface MLOrder {
  id: number;
  status: string;
  status_detail: any;
  date_created: string;
  date_closed: string;
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
}

export interface Buyer {
  id: string;
  nickname: string;
  first_name: string;
  last_name: string;
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
