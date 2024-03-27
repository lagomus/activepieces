import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stretoAuth } from '../..';

export const update_product = createAction({
  name: 'update_product',
  auth: stretoAuth,
  displayName: 'Update Product',
  description: 'Update product attributes',
  props: {
    productId: Property.ShortText({
      displayName: 'Product Id',
      description: 'Prodcut Id to update',
      required: true,
    }),
    attributes: Property.Json({
      displayName: 'Attributes to update',
      description: 'Atributes to update in JSON format',
      required: true,
    }),
  },
  async run(context) {
    const attributes = context.propsValue['attributes'];
    const productId = context.propsValue['productId'];

    return await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      headers: {
        'x-api-key': context.auth.apiKey,
        'Content-Type': 'application/json',
      },
      url: `${context.auth.baseUrl}/app/products/${productId}`,
      body: {
        attributes: attributes,
      },
    });
  },
});
