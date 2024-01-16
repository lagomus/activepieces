import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpResponse } from '@activepieces/pieces-common';
import { meliAuth } from '../..';
import { Reviews, ProductStretoML } from '../common/models';

export const fetch_review = createAction({
  name: 'fetch_review',
  auth: meliAuth,
  displayName: 'Fetch Review',
  description: 'Fetch review from Mercado Libre',
  props: {
    productId: Property.ShortText({
      displayName: 'Mercado Libre product id',
      description: 'Identificador de producto en Mercado Libre',
      required: true
    }),
  },
  async run(context) {
  const productId = context.propsValue['productId'];
  const token = context.auth.access_token;
  const review = await httpClient.sendRequest<Reviews>({
    method: HttpMethod.GET,
    headers: { Authorization: `Bearer ${token} ` },
    url: `https://api.mercadolibre.com/reviews/item/${productId}`,
  });
    return {
      review: review.body
    };
  },
});
