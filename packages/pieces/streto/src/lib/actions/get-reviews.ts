import { createAction, Property, StoreScope } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stretoAuth } from '../..';

export const get_reviews = createAction({
  name: 'get_reviews',
  auth: stretoAuth,
  displayName: 'Get reviews',
  description: 'Get reviews from ML products',
  props: {
    
  },
  async run(context) {
    const reviews = await context.store.get<any>('product');
    console.log('reviews',reviews)
    //PATCH A PRIDUCT CON EL ID QUE SE CORRESPONDE AL SKU DE LA LLAMADE DE FETCH PRODUCTS BY CATAGLO DE DONDE SAQUE EL SKU
    //EL PATCH VA A MAPEARSE CON LOS ATRIBUTOS REVIEW Y COINT DE MARCOVECCHIO CONTRA LOS QUE CONSEGUI EN EL LOOP ACA

    // const response = await httpClient.sendRequest<Catalog[]>({
    //   method: HttpMethod.GET,
    //   headers: {
    //     'x-api-key': context.auth.apiKey,
    //   },
    //   url: `${context.auth.baseUrl}/app/catalogs?filter={"where":{"name":"${catalogName}"}}`,
    // });

    return {
      reviews
    };
  },
});
