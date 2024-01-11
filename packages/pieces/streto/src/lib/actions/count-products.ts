import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stretoAuth } from '../..';

export const count_products = createAction({
  name: 'count_products', // Must be a unique across the piece, this shouldn't be changed.
  auth: stretoAuth,
  displayName: 'Count Products by Catalog Id',
  description: 'Fetch products count by Catalog Id from Streto',
  props: {
    catalog_id: Property.ShortText({
      displayName: 'Catalog ID',
      description: undefined,
      required: true,
    }),
  },
  async run(context) {
    const catalogId = context.propsValue['catalog_id'];
    const url = `${context.auth.baseUrl}/app/catalogs/${catalogId}/products/count?filter={"where":{"type":{"neq":"variant"}}}`;
    const response = await httpClient.sendRequest<{ count: number }>({
      method: HttpMethod.GET,
      headers: {
        'x-api-key': context.auth.apiKey,
      },
      url,
    });
    const count: number = response.body.count;

    return {
      count,
    };
  },
});
