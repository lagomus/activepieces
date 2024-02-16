import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { meliAuth } from '../..';
import { Cart } from '../common/models';

export const fetch_order_shipment = createAction({
  name: 'fetch_order_shipment',
  auth: meliAuth,
  displayName: 'Fetch Order Shipment',
  description: 'Fetch shipment data from Mercado Libre order',
  props: {
    orderId: Property.ShortText({
      displayName: 'Order Id',
      description: 'Input: Fetch order order id. Identificador de órden',
      required: true,
    }),
    pack: Property.Json({
      displayName: 'Orders Pack',
      description: 'Input: Fetch pack orders cartOrders. Paquete de órdenes',
      required: true,
    }),
  },
  async run(context) {
    const orderId = context.propsValue.orderId;
    const pack = context.propsValue.pack as unknown as Cart;
    const token = context.auth.access_token;

    if (pack && (pack.id !== null || pack.id !== undefined || pack.id !== '')) {
      return await httpClient
        .sendRequest<string[]>({
          method: HttpMethod.GET,
          headers: { Authorization: `Bearer ${token} ` },
          url: `https://api.mercadolibre.com/shipments/${pack.shipment.id}`,
        })
        .then((r) => {
          return r.body;
        })
        .catch(() => {
          return {};
        });
    } else {
      return await httpClient
        .sendRequest<string[]>({
          method: HttpMethod.GET,
          headers: { Authorization: `Bearer ${token} ` },
          url: `https://api.mercadolibre.com/orders/${orderId}/shipments`,
        })
        .then((r) => {
          return r.body;
        })
        .catch(() => {
          return {};
        });
    }
  },
});
