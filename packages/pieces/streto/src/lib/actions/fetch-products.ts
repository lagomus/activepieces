import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stretoAuth } from '../..';

export const fetch_products = createAction({
  name: 'fetch_products', // Must be a unique across the piece, this shouldn't be changed.
  auth: stretoAuth,
  displayName: 'Fetch Products',
  description: 'Fetch products from Streto',
  props: {
    catalog_id: Property.ShortText({
      displayName: 'Catalog ID',
      description: undefined,
      required: true,
    }),
  },
  async run(context) {
    const catalogId = context.propsValue['catalog_id'];

    const response = await httpClient.sendRequest<Product[]>({
      method: HttpMethod.GET,
      headers: {
        'x-api-key': context.auth.apiKey,
      },
      url: `${context.auth.baseUrl}/catalogs/${catalogId}/products?filter={"where":{"type":{"neq":"variant}}}`,
    });
    const products: Product[] = response.body;

    return {
      products,
    };
  },
});
