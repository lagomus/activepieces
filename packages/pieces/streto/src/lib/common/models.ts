type Catalog = {
  id: string;
  [propName: string]: any;
};

//--------------------------------------------- product
type Product = {
  id: string;
  type?: string;
  attributes: Attributes;
  scopedAttributes?: ScopedAttributes;
  attributeSets?: string[];
};

type Rule = {
  row: string;
  values: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
    E?: string;
    F?: string;
    G?: string;
  };
};

type Attributes = {
  name?: string;
  sku: string;
  urlKey?: string;
  mvb_cost: string;
  mvb_source_rule: string;
  enabled?: boolean;
  images?: Image[];
  [propName: string]: any;
};

type Image = {
  id: string;
  roles: string[];
};

type ScopedAttributes = {};

type StretoShippingMethodItem = {
  itemId: string;
  qty: number;
};

//--------------------------------------------- ML order items
type MLOrderItems = {
  id?: string;
  productId?: string;
  finalProductId?: string;
  variantOptions?: VariantOptions;
  qtyOrdered: number;
  qtyInvoiced: number;
  qtyShipped: number;
  shippable: boolean;
  taxes: Tax[];
  details: Details;
  totals: Totals;
  additionalInformation: AdditionalInformation;
};

type VariantOptions = {};

type Tax = {};

type Details = {};

type Totals = {};

type AdditionalInformation = { [propName: string]: any };

//--------------------------------------------- ML order
type Order = {
  id: number;
  date_created: string;
  last_updated: string;
  expiration_date: string;
  date_closed: string;
  comment: any;
  pack_id: any;
  pickup_id: any;
  fulfilled: any;
  hidden_for_seller: any;
  buying_mode: string;
  shipping_cost: any;
  application_id: any;
  mediations: any[];
  total_amount: number;
  paid_amount: number;
  coupon: Coupon;
  order_items: OrderItem[];
  currency_id: string;
  payments: Payment[];
  shipping: Shipping;
  status: string;
  status_detail: any;
  tags: string[];
  internal_tags: any[];
  feedback: Feedback;
  context: Context;
  seller: Seller;
  buyer: Buyer;
  taxes: Taxes;
  cancel_detail: any;
  manufacturing_ending_date: any;
  order_request: OrderRequest;
};

type Coupon = {
  amount: number;
  id: any;
};

type OrderItem = {
  item: Item;
  quantity: number;
  requested_quantity: RequestedQuantity;
  picked_quantity: any;
  unit_price: number;
  full_unit_price: number;
  currency_id: string;
  manufacturing_days: any;
  sale_fee: number;
  listing_type_id: string;
  base_exchange_rate: any;
  base_currency_id: any;
  element_id: any;
  discounts: any;
  bundle: any;
  compat_id: any;
};

type Item = {
  id: string;
  title: string;
  category_id: string;
  variation_id: any;
  seller_custom_field: any;
  variation_attributes: any[];
  warranty: string;
  condition: string;
  seller_sku: string;
  global_price: any;
  net_weight: any;
};

type RequestedQuantity = {
  measure: string;
  value: number;
};

type Payment = {
  id: number;
  order_id: number;
  payer_id: number;
  collector: Collector;
  card_id: any;
  reason: string;
  site_id: string;
  payment_method_id: string;
  currency_id: string;
  installments: number;
  issuer_id: string;
  atm_transfer_reference: AtmTransferReference;
  coupon_id: any;
  activation_uri: any;
  operation_type: string;
  payment_type: string;
  available_actions: string[];
  status: string;
  status_code: any;
  status_detail: string;
  transaction_amount: number;
  transaction_amount_refunded: number;
  taxes_amount: number;
  shipping_cost: number;
  coupon_amount: number;
  overpaid_amount: number;
  total_paid_amount: number;
  installment_amount: any;
  deferred_period: any;
  date_approved: string;
  transaction_order_id: any;
  date_created: string;
  date_last_modified: string;
  marketplace_fee: number;
  reference_id: any;
  authorization_code: any;
};

type Collector = {
  id: number;
};

type AtmTransferReference = {
  transaction_id: any;
  company_id: any;
};

type Shipping = {
  id: any;
};

type Feedback = {
  seller: any;
  buyer: any;
};

type Context = {
  channel: string;
  site: string;
  flows: string[];
  application: any;
  product_id: any;
  store_id: any;
};

type Seller = {
  id: number;
};

type Buyer = {
  id: number;
  nickname: string;
  first_name: string;
  last_name: string;
};

type Taxes = {
  amount: number;
  currency_id: string;
  id: string;
};

type OrderRequest = {
  change: any;
  return: any;
};

//--------------------------------------------- settings
type Settings = {
  [propName: string]: any;
};
//--------------------------------------------- ML address
type Address = {
  id?: string;
  address_line?: string;
  street_name?: string;
  street_number?: string;
  comment?: string;
  zip_code?: string;
  city?: City;
  state?: State;
  country?: Country;
  neighborhood?: Neighborhood;
  municipality?: Municipality;
  agency?: string;
  types?: string[];
  latitude?: number;
  longitude?: number;
  geolocation_type?: string;
  delivery_preference?: string;
  receiver_name?: string;
  receiver_phone?: string;
};

type City = {
  id: string;
  name: string;
};

type State = {
  id: string;
  name: string;
};

type Country = {
  id: string;
  name: string;
};

type Neighborhood = {
  id?: string;
  name?: string;
};

type Municipality = {
  id?: string;
  name?: string;
};

type MLShipping = {
  id?: number;
  mode: string;
  created_by: string;
  order_id: number;
  order_cost: number;
  base_cost: number;
  site_id?: string;
  status: string;
  substatus: string;
  status_history: StatusHistory;
  substatus_history: any[];
  date_created: string;
  last_updated: string;
  tracking_number: string;
  tracking_method: string;
  service_id?: number;
  carrier_info: any;
  sender_id?: number;
  sender_address: Address;
  receiver_id?: number;
  receiver_address: Address;
  shipping_items: ShippingItem[];
  shipping_option: ShippingOption;
  comments: any;
  date_first_printed: string;
  market_place: string;
  return_details: any;
  tags: string[];
  delay: string[];
  type: string;
  logistic_type: string;
  application_id: any;
  return_tracking_number: any;
  cost_components: CostComponents;
};

type StatusHistory = {
  date_cancelled: any;
  date_delivered: any;
  date_first_visit: any;
  date_handling: string;
  date_not_delivered: any;
  date_ready_to_ship: string;
  date_shipped: any;
  date_returned: any;
};

type ShippingItem = {
  id?: string;
  description: string;
  quantity: number;
  dimensions: string;
  dimensions_source: DimensionsSource;
};

type DimensionsSource = {
  id?: string;
  origin: string;
};

type ShippingOption = {
  id?: number;
  shipping_method_id?: number;
  name: string;
  currency_id: string;
  list_cost: number;
  cost: number;
  delivery_type: string;
  estimated_schedule_limit: EstimatedScheduleLimit;
  estimated_delivery_time: EstimatedDeliveryTime;
  estimated_delivery_limit: EstimatedDeliveryLimit;
  estimated_delivery_final: EstimatedDeliveryFinal;
  estimated_delivery_extended: EstimatedDeliveryExtended;
  estimated_handling_limit: EstimatedHandlingLimit;
};

type EstimatedScheduleLimit = {
  date: any;
};

type EstimatedDeliveryTime = {
  type: string;
  date: string;
  unit: string;
  offset: Offset;
  time_frame: TimeFrame;
  pay_before: any;
  shipping: number;
  handling: number;
  schedule: any;
};

type Offset = {
  date: string;
  shipping: number;
};

type TimeFrame = {
  from: any;
  to: any;
};

type EstimatedDeliveryLimit = {
  date: string;
  offset: number;
};

type EstimatedDeliveryFinal = {
  date: string;
  offset: number;
};

type EstimatedDeliveryExtended = {
  date: string;
  offset: number;
};

type EstimatedHandlingLimit = {
  date: string;
};

type CostComponents = {
  special_discount: number;
  loyal_discount: number;
  compensation: number;
  gap_discount: number;
  ratio: number;
};

type StretoOrder = {
  externalId: string;
  orderNumber: string;
  currencyCode: string;
  items: OrderItem[];
  state: string;
  shippingAddresses: ShippingAddress[];
  billingAddresses: BillingAddress[];
  paymentMethods: PaymentMethods[];
  history: OrderHistory[];
  totals: OrderTotals[];
  additionalInformation: AdditionalInformation;
};

type ShippingAddress = {
  personalInfo: PersonalInfo;
  street: string;
  countryCode: string;
  regionCode: string;
  city: string;
  postalCode: string;
  phone?: string;
  notes?: string;
  shippingMethods: ShippingMethod;
  totals: ShippingTotals;
};

type BillingAddress = {
  street: string;
  countryCode: string;
  regionCode: string;
  city: string;
  postalCode: string;
  phone?: string;
  notes?: string;
};

type PersonalInfo = {
  firstName?: string;
  lastName?: string;
};

type ShippingMethod = {
  carrierCode: string;
  methodCode: string;
  totals: ShippingTotals;
  items: StretoShippingMethodItem[];
};

type ShippingTotals = {
  shipping: number;
};

type PaymentMethods = {
  code: string;
};

type OrderHistory = {
  createdAt: string;
  title: string;
  stateFrom?: string;
  stateTo: string;
};

type OrderTotals = {
  subtotal: number;
  shipping: number;
  globalTax: number;
  tax: number;
  promotionsDiscount: number;
  couponsDiscount: number;
  globalDiscount: number;
  discount: number;
  grandTotal: number;
};

type StockItem = {
  productId?: string;
  type?: string;
  status?: string;
  qty?: number;
};

type Price = {
  productId?: string;
  priceListId?: string;
  currencyCode?: string;
  qty?: number;
  value?: number;
};

type PriceList = {
  id?: string;
  name?: string;
  enabled?: boolean;
};
