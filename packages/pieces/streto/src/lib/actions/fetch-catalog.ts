import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stretoAuth } from '../..';

export const fetch_catalog = createAction({
  name: 'fetch_catalog', // Must be a unique across the piece, this shouldn't be changed.
  auth: stretoAuth,
  displayName: 'Fetch Catalog',
  description: 'Fetch catalog from Streto',
  props: {
    catalog_name: Property.ShortText({
      displayName: 'Catalog Name',
      description: undefined,
      required: true,
    }),
  },
  async run(context) {
    const catalogName = context.propsValue['catalog_name'];

    const response = await httpClient.sendRequest<Catalog>({
      method: HttpMethod.GET,
      headers: {
        'x-api-key': context.auth.apiKey,
      },
      url: `${context.auth.baseUrl}/catalogs?filter={"where":{"name":"${catalogName}"}}`,
    });
    const catalogId: string = response.body.id;

    return {
      catalogId,
    };
  },
});
