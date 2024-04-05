import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stretoAuth } from '../..';

export const update_stock = createAction({
  name: 'update_stock',
  auth: stretoAuth,
  displayName: 'Update Stock',
  description: 'Update product stock',
  props: {
    productId: Property.ShortText({
      displayName: 'Product Id',
      description: 'Prodcut Id to update',
      required: true,
    }),
    stock: Property.Number({
      displayName: 'Stock',
      description: 'Stock',
      required: true,
    }),
  },
  async run(context) {
    const stock = context.propsValue['stock'];
    const productId = context.propsValue['productId'];

    return await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      headers: {
        'x-api-key': context.auth.apiKey,
        'Content-Type': 'application/json',
      },
      url: `${context.auth.baseUrl}/app/stock-items/${productId}`,
      body: {
        qty: stock,
      },
    });
  },
});
