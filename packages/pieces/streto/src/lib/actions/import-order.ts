import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stretoAuth } from '../..';
import { randomUUID } from 'crypto';

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

const getOrderMapping = (
  order: Order[],
  orderItems: MLOrderItems[],
  shippingAddress: Address,
  billingAddress: Address,
  shipping: MLShipping,
  shipping_items: StretoShippingMethodItem[]
) => {
  return {
    externalId: order[0].id.toString(),
    orderNumber: order[0].id.toString(),
    currencyCode: order[0].currency_id,
    items: orderItems,
    state: getOrderState(order[0].status),
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
              phone: shippingAddress?.receiver_phone,
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
        createdAt: order[0].date_created,
        title: 'Order created',
        stateFrom: null,
        stateTo: getOrderState(order[0].status),
      },
    ],
    totals: {
      subtotal: order[0].total_amount,
      shipping: shipping.shipping_option?.cost
        ? shipping.base_cost + shipping.shipping_option?.cost
        : shipping.base_cost,
      globalTax: 0,
      tax: order[0].taxes?.amount || 0,
      promotionsDiscount: 0,
      couponsDiscount: order[0].coupon?.amount || 0,
      globalDiscount: 0,
      discount: order[0].coupon?.amount || 0,
      grandTotal:
        order[0].total_amount +
        shipping.base_cost +
        shipping.shipping_option?.cost
          ? shipping.shipping_option?.cost
          : 0 + order[0].taxes?.amount
          ? order[0].taxes?.amount
          : 0 + order[0].coupon?.amount
          ? order[0].coupon?.amount
          : 0,
    },
    additionalInformation: {
      origin: 'Mercado Libre',
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
    order: Property.Array({
      displayName: 'Order',
      description: 'Mercado Libre Order',
      required: true,
    }),
    orderShipment: Property.Json({
      displayName: 'Order Shipment',
      description: 'Mercado Libre Order Shipment',
      required: true,
    }),
    stretoOrderItems: Property.Array({
      displayName: 'Streto Order Items',
      description: 'Streto products matching Mercado Libre order items',
      required: true,
    }),
    cdn_url: Property.ShortText({
      displayName: 'CDN url',
      description: 'Streto Content Delivery Network url',
      required: false,
      defaultValue: '',
    }),
  },

  async run(context) {
    const order: Order[] = context.propsValue['order'] as Order[];
    const shipping: MLShipping = context.propsValue[
      'orderShipment'
    ] as MLShipping;
    const stretoProducts: Product[] = context.propsValue[
      'stretoOrderItems'
    ] as Product[];
    const cdnUrl = context.propsValue['cdn_url'] as string;
    const orderProducts: OrderItem[] = order[0].order_items;

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

    let shippingAddress: Address = shipping ? shipping?.receiver_address : {};
    let billingAddress: Address = shipping ? shipping?.receiver_address : {};
    const url = 'https://core-dev.streto.tienda/app/orders/import';

    let mapping = getOrderMapping(
      order,
      orderItems,
      shippingAddress,
      billingAddress,
      shipping,
      shipping_items
    );
    let orderImported: any = {};
    await httpClient
      .sendRequest<StretoOrder>({
        method: HttpMethod.POST,
        headers: {
          'x-api-key': context.auth.apiKey,
        },
        url,
        body: { ...mapping },
      })
      .then((r) => (orderImported = r.status === 200 ? r.body : {}))
      .catch((error) => {
        orderImported = error._err;
     });
    return {
      orderImported
    };
  },
});
