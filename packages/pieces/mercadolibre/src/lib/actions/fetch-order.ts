import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { meliAuth } from '../..';
import { MLOrder, OrderItem } from '../common/models';

export const fetch_order = createAction({
  name: 'fetch_order',
  auth: meliAuth,
  displayName: 'Fetch Order',
  description: 'Fetch order from Mercado Libre',
  props: {
    orderId: Property.ShortText({
      displayName: 'Order Id',
      description: 'Identificador de órden',
      required: true,
      defaultValue: '',
    }),
  },
  async run(context) {
    const orderId = context.propsValue.orderId;
    const token = context.auth.access_token;

    return httpClient
      .sendRequest<MLOrder>({
        method: HttpMethod.GET,
        headers: { Authorization: `Bearer ${token} ` },
        url: `https://api.mercadolibre.com/orders/${orderId}`,
      })
      .then(async (res) => {
        if (res.status === 200) {
          await context.store.put(orderId, res.body, StoreScope.FLOW);
          const skusIntermediate = res.body.order_items.map(
            (o: OrderItem) =>
              (o.item.seller_sku ?? '') ||
              o.item.seller_custom_field?.includes('sku')
          );
          return {
            order: res.body,
            skus: JSON.stringify(skusIntermediate),
            packId: res.body.pack_id ? res.body.pack_id : '',
          };
        } else {
          return {
            order: '',
            skus: '',
            packId: orderId,
          };
        }
      })
      .catch(() => {
        return {
          order: '',
          skus: '',
          packId: orderId,
        };
      });
  },
});
