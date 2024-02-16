import {
  ActionContext,
  ArrayProperty,
  createAction,
  CustomAuthProperty,
  JsonProperty,
  Property,
  SecretTextProperty,
  ShortTextProperty,
  StoreScope,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stretoAuth } from '../..';
import { randomUUID } from 'crypto';
import { isEmpty } from '@activepieces/shared';

const getOrderItems = (
  context: ActionContext<
    CustomAuthProperty<
      true,
      { baseUrl: ShortTextProperty<true>; apiKey: SecretTextProperty<true> }
    >,
    {
      order: JsonProperty<true>;
      pack: JsonProperty<true>;
      orderShipment: JsonProperty<true>;
      stretoOrderItems: ArrayProperty<true>;
      cdn_url: ShortTextProperty<false>;
    }
  >,
  order: Order,
  pack: Cart
): Promise<OrderItem[]>[] => {
  if (pack && pack.id !== '') {
    return pack.orders?.map(async (p) => {
      return await context.store
        .get(p.id.toString(), StoreScope.FLOW)
        .then((r) => {
          return (r as Order).order_items;
        });
    });
  } else {
    return [
      new Promise((resolve) => {
        const items = order.order_items !== undefined ? order.order_items : [];
        resolve(items);
      }),
    ];
  }
};

const getOrderState = (MLState: string): string => {
  switch (MLState) {
    case 'paid' || 'partially_refunded' || 'pending_cancel':
      return 'processing';
    case 'cancelled':
      return 'canceled';
    default:
      return 'pending';
  }
};

const mappingProducts = (
  orderProducts: OrderItem[],
  stretoProducts: Product[],
  shipping_items: StretoShippingMethodItem[],
  cdnUrl: string,
  orderItems: MLOrderItems[]
) => {
  return orderProducts.forEach((pr: OrderItem) => {
    const pId = randomUUID();
    const stretoProduct = stretoProducts?.find(
      (p) => p.attributes?.sku === pr.item.seller_sku
    );
    let image = undefined;
    let imageUrl = undefined;
    if (cdnUrl !== '') {
      image = stretoProduct?.attributes.images?.find((i) =>
        i.roles.find((r) => r === 'thumbnail')
      );
      if (image === undefined) {
        image = stretoProduct?.attributes.images?.find((i) =>
          i.roles.find((r) => r === 'default')
        );
      }
      if (image !== undefined) {
        imageUrl = `${cdnUrl}/${image.id}`;
      }
    }

    let details =
      cdnUrl !== '' && imageUrl !== undefined
        ? {
            name: pr.item.title,
            sku: pr.item.seller_sku,
            imageUrl,
          }
        : {
            name: pr.item.title,
            sku: pr.item.seller_sku,
          };
    orderItems.push({
      productId: stretoProducts.length > 0 ? pId : null,
      qtyOrdered: pr.quantity,
      qtyInvoiced: 0,
      qtyShipped: 0,
      shippable: true,
      taxes: [],
      details,
      totals: {
        unit: pr.unit_price,
        discount: 0,
        unitDiscount: 0,
        tax: 0,
        subtotal: pr.quantity * pr.unit_price,
        grandTotal: pr.quantity * pr.unit_price,
      },
      additionalInformation: {},
    });
    shipping_items.push({ itemId: pId, qty: pr.quantity });
  });
};

const getShowItems = (orderItems: MLOrderItems[]) => {
  if (orderItems.length === 0) {
    return [];
  } else {
    let items: ShowItems[] = [];
    orderItems.map((o) => {
      let item: ShowItems = {
        productId: null,
        totals: {
          unit: 0,
          unitDiscount: 0,
          subtotal: 0,
          discount: 0,
          tax: 0,
          grandTotal: 0,
          couponsDiscount: 0,
        },
      };
      item.id = o?.id;
      item.productId = o.productId;
      item.qty = o.productId !== null ? o.qtyOrdered : undefined;
      item.isAvailable = o.productId !== null;
      item.details = o.productId !== null ? { ...o.details } : {};
      item.totals = {
        unit: o.productId !== null ? o.totals.unit || 0 : 0,
        unitDiscount: o.productId !== null ? o.totals.unitDiscount || 0 : 0,
        subtotal: o.productId !== null ? o.totals.subtotal || 0 : 0,
        discount: o.productId !== null ? o.totals.discount || 0 : 0,
        tax: o.productId !== null ? o.taxes || 0 : 0,
        grandTotal: o.productId !== null ? o.totals?.unit_price || 0 * o.qtyOrdered : 0,
        couponsDiscount: o.productId !== null ? 0 : 0,
      };
      item.variantOptions = o.productId !== null ? o.variantOptions : {};
      return items.push(item);
    });
    return items;
  }
};

const getTotal = (order_items: MLOrderItems[]) => {
  let total = 0;
  order_items.map((o) => {
    return (total += (o.totals?.unit || 0) * o.qtyOrdered);
  });
  return total;
};

const getOrderMapping = (
  order: Order,
  pack: Cart,
  orderItems: MLOrderItems[],
  shippingAddress: Address,
  billingAddress: Address,
  shipping: MLShipping,
  shipping_items: StretoShippingMethodItem[],
  orderProducts: OrderItem[]
) => {
  const externalId =
    order?.id !== undefined && order?.pack_id
      ? order?.pack_id.toString()
      : order?.id !== undefined
      ? order?.id?.toString()
      : pack.id;
  const orderNumber =
    order?.id !== undefined && order?.pack_id
      ? order?.pack_id.toString()
      : order?.id !== undefined
      ? order?.id?.toString()
      : pack.id;
  return {
    externalId: externalId.toString(),
    orderNumber: orderNumber.toString(),
    currencyCode:
      order?.id !== undefined
        ? order.currency_id
        : orderProducts[0].currency_id.toString(),
    items: orderItems,
    state: getOrderState(order.status),
    shippingAddresses:
      shippingAddress !== undefined && Object.keys(shippingAddress).length > 0
        ? [
            {
              personalInfo: shippingAddress.receiver_name
                ? {
                    firstName: shippingAddress.receiver_name.split(' ')[0],
                    lastName: shippingAddress.receiver_name.split(' ')[1],
                  }
                : {},
              street: shippingAddress.street_number
                ? `${shippingAddress.street_name}/n${shippingAddress.street_number}`
                : `${shippingAddress.street_name}`,
              countryCode: shippingAddress.country?.id,
              regionCode: shippingAddress.state?.id,
              city: shippingAddress.city?.name,
              postalCode: shippingAddress.zip_code,
              phone: shippingAddress.receiver_phone
                ? shippingAddress.receiver_phone
                : undefined,
              notes:
                shippingAddress.comment !== null
                  ? shippingAddress.comment
                  : undefined,
              shippingMethods: [
                {
                  carrierCode: 'streto',
                  methodCode: 'offline',
                  totals: {
                    shipping: shipping.shipping_option.cost,
                  },
                  items: [...shipping_items],
                },
              ],
              totals: {
                shipping: shipping.base_cost,
              },
            },
          ]
        : [],

    billingAddresses:
      billingAddress !== undefined && Object.keys(billingAddress).length > 0
        ? [
            {
              personalInfo: shippingAddress.receiver_name
                ? {
                    firstName: shippingAddress.receiver_name.split(' ')[0],
                    lastName: shippingAddress.receiver_name.split(' ')[1],
                  }
                : {},
              street: billingAddress.street_number
                ? `${billingAddress.street_name}/n${billingAddress.street_number}`
                : `${billingAddress.street_name}`,
              countryCode: billingAddress.country?.id,
              regionCode: billingAddress.state?.id,
              city: billingAddress.city?.name,
              postalCode: billingAddress.zip_code,
              phone:
                shippingAddress?.receiver_phone !== null
                  ? shippingAddress?.receiver_phone
                  : '',
              notes:
                billingAddress.comment !== null
                  ? billingAddress.comment
                  : undefined,
            },
          ]
        : [],
    paymentMethods: [
      {
        code: 'offline',
      },
    ],
    history: [
      {
        createdAt:
          order?.id !== undefined ? order.date_created : pack.date_created,
        title: 'Order created',
        stateFrom: null,
        stateTo: getOrderState(order.status),
      },
    ],
    totals: {
      subtotal: getTotal(orderItems),
      shipping: shipping.base_cost
        ? shipping.base_cost
        : shipping.shipping_option?.cost,
      globalTax: 0,
      tax: order.taxes?.amount || 0,
      promotionsDiscount: 0,
      couponsDiscount: order.coupon?.amount || 0,
      globalDiscount: 0,
      discount: order.coupon?.amount || 0,
      grandTotal:
        getTotal(orderItems) + order.taxes?.amount ??
        0 +
          (shipping.base_cost
            ? shipping.base_cost
            : shipping.shipping_option?.cost),
    },
    additionalInformation: {
      origin: 'Mercado Libre',
      showItems: getShowItems(orderItems),
      order: JSON.stringify(order),
      shipping: shipping ? JSON.stringify(shipping) : [],
    },
  };
};

export const import_order = createAction({
  name: 'import_order',
  auth: stretoAuth,
  displayName: 'Import Order',
  description: 'Import order from Mercado Libre to Streto',
  props: {
    order: Property.Json({
      displayName: 'Order',
      description: 'Input: fetch order, order. Mercado Libre Order',
      required: true,
    }),
    pack: Property.Json({
      displayName: 'Pack',
      description:
        'Input: fetch pack orders cartOrders. Pack order from ML, contains multiple items in a package',
      required: true,
    }),
    orderShipment: Property.Json({
      displayName: 'Order Shipment',
      description: 'Input: Fetch Order Shipment. Mercado Libre Order Shipment',
      required: true,
    }),
    stretoOrderItems: Property.Array({
      displayName: 'Streto Order Items',
      description:
        'Input: Fetch products products. Streto products matching Mercado Libre order items',
      required: true,
    }),
    cdn_url: Property.ShortText({
      displayName: 'CDN url',
      description:
        'Input: Code after fetch settings. Streto Content Delivery Network url',
      required: false,
      defaultValue: '',
    }),
  },

  async run(context) {
    const order: Order = context.propsValue.order as Order;
    const shipping: MLShipping = context.propsValue[
      'orderShipment'
    ] as MLShipping;
    const stretoProducts: Product[] = context.propsValue[
      'stretoOrderItems'
    ] as Product[];
    const cdnUrl = context.propsValue['cdn_url'] as string;
    const pack = context.propsValue.pack as Cart;
    const order_items = getOrderItems(context, order, pack);

    const processedOrders = (await context.store.get(
      'ordersProcessed',
      StoreScope.PROJECT
    )) as string[];
    const orderId = order.id !== undefined ? order.id.toString() : '';
    const newPack = (await context.store.get(
      'newPack',
      StoreScope.PROJECT
    )) as string;
    if (
      (orderId !== '' && !processedOrders?.includes(orderId)) ||
      newPack !== ''
    ) {
      return Promise.all(order_items).then(async (r) => {
        const orderProducts: OrderItem[] = [];
        r.map((e) => e.map((t) => orderProducts.push(t)));
        const orderItems: MLOrderItems[] = [];
        let shipping_items: StretoShippingMethodItem[] = [];
        if (orderProducts.length > 0) {
          mappingProducts(
            orderProducts,
            stretoProducts,
            shipping_items,
            cdnUrl,
            orderItems
          );
        }

        let shippingAddress: Address = shipping
          ? shipping?.receiver_address
          : {};
        let billingAddress: Address = shipping
          ? shipping?.receiver_address
          : {};
        const url = `${context.auth.baseUrl}/app/orders/import`;

        let mapping = getOrderMapping(
          order,
          pack,
          orderItems,
          shippingAddress,
          billingAddress,
          shipping,
          shipping_items,
          orderProducts
        );

        await httpClient
          .sendRequest<StretoOrder>({
            method: HttpMethod.POST,
            headers: {
              'x-api-key': context.auth.apiKey,
            },
            url,
            body: { ...mapping },
          })
          .then(async (res) => {
            if (res.status === 200 || res.status === 204) {
              const orders = await context.store.get<string[]>(
                'ordersProcessed',
                StoreScope.PROJECT
              );
              if (orders !== null && !isEmpty(orders)) {
                let newOrders: string[] = orders;
                if (!orders.includes(res.body.orderNumber.toString())) {
                  newOrders.push(res.body.orderNumber.toString());
                  await context.store.delete(
                    'ordersProcessed',
                    StoreScope.PROJECT
                  );
                  await context.store.put(
                    'ordersProcessed',
                    newOrders,
                    StoreScope.PROJECT
                  );
                  return res.body;
                }
              } else {
                await context.store.put(
                  'ordersProcessed',
                  [res.body.orderNumber.toString()],
                  StoreScope.PROJECT
                );
                return res.body;
              }
            }
            return res.body;
          });
      });
    } else {
      return {
        imported: 'order already processed',
      };
    }
  },
});
