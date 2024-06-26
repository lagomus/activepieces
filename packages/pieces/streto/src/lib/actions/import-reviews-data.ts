import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stretoAuth } from '../..';

export const import_reviews_data = createAction({
  name: 'import_reviews_data',
  auth: stretoAuth,
  displayName: 'Import reviews data',
  description: 'Import reviews rating and totals from ML products',
  props: {
    productsIds: Property.Array({
      displayName: 'Product Ids',
      description:
        'Product Streto Id with correspondent Mercado Libre product id',
      required: true,
      defaultValue: [],
    }),
    average_rating: Property.Number({
      displayName: 'Average Rating',
      description: 'Mercado Libre average review rating stars',
      required: true,
    }),
    total_reviews: Property.Number({
      displayName: 'Total Reviews',
      description: 'Total Reviews from Mercado Libre product',
      required: true,
    }),
    MlProductId: Property.ShortText({
      displayName: 'Product Id',
      description: 'Id of Mercado Libre product reviews owner',
      required: true,
    }),
  },
  async run(context) {
    const productsIds = context.propsValue['productsIds'] as any[];
    const stars = context.propsValue['average_rating'];
    const reviewsCount = context.propsValue['total_reviews'];
    const MlProductId = context.propsValue['MlProductId'];
    const currentStretoId = productsIds.map((p) =>
      p.find((e: any) => e[1] === MlProductId)
    );
    let url = '';
    if (currentStretoId !== undefined) {
      const productId = currentStretoId[0][0];
      url = `${context.auth.baseUrl}/app/products/${productId}`;
    }
    return await httpClient
      .sendRequest<any>({
        method: HttpMethod.PATCH,
        headers: {
          'x-api-key': context.auth.apiKey,
        },
        url,
        body: {
          attributes: {
            reviews_count: reviewsCount || 0,
            rating: stars || 0,
          },
        },
      })
      .then(async (r) => {
        if (r.status >= 200 && r.status < 300) {
          let acum = (await context.store.get('success')) as number | null;
          if (acum !== null) {
            await context.store.put('successes', acum + 1, StoreScope.PROJECT);
          } else {
            await context.store.put('successes', 1, StoreScope.PROJECT);
          }
          return {success: `with code ${r.status}`}
        }
        else {return {}} 
      })
      .catch(async (error) => {
        let acum = (await context.store.get('fails')) as number | null;
        if (acum !== null) {
          await context.store.put('fails', acum + 1, StoreScope.PROJECT);
        } else {
          await context.store.put('fails', 1, StoreScope.PROJECT);
        }
        return {fail: error}
      });
  },
});
