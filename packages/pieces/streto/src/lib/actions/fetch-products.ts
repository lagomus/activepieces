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
    filter_attribute: Property.ShortText({
      displayName: 'Attribute filter',
      description: "Use to pass attribute to filter by",
      required: false
    }),
    filter_array: Property.LongText({
      displayName: 'Array filter',
      description: "Use to pass an array of elements to filter by",
      required: false
    }),
  },
  async run(context) {
    const catalogId = context.propsValue['catalog_id'];
    let url = `${context.auth.baseUrl}/app/catalogs/${catalogId}/products?filter={"where":{"type":{"neq":"variant"}}}`;
    const filterArray = context.propsValue['filter_array'];
    const filterAttribute = context.propsValue['filter_attribute'];
    if (filterArray && filterAttribute) {
      url = `${context.auth.baseUrl}/app/catalogs/${catalogId}/products?filter={"where":{"and":[{${filterAttribute}:{"inq":${filterArray}}},{"type":{"neq":"variant"}}]}}`;
    }
    const response = await httpClient.sendRequest<Product[]>({
      method: HttpMethod.GET,
      headers: {
        'x-api-key': context.auth.apiKey,
      },
      url
    });
    const products: Product[] = response.body;

    return {
      products,
    };
  },
});
