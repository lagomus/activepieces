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

export type Product = {
  id: string;
  type?: string;
  qty?: number;
  price?: number;
  attributes: Attributes;
  scopedAttributes?: ScopedAttributes;
  attributeSets?: string[];
  attributeSetName?: string;
};

type Attributes = {
  name?: string;
  sku: string;
  brand?: string;
  urlKey?: string;
  mvb_cost: string;
  mvb_source_rule: string;
  enabled?: boolean;
  images?: Image[];
  item_condition?: string;
  model?: string;
  description?: string;
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

export type Attribute = {
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
};

export type AttributeSet = {
  name: string;
  attributes: string;
};
