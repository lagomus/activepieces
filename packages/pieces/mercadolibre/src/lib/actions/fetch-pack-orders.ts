import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import { meliAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Cart, MLOrder } from '../common/models';

export const fetch_pack_orders = createAction({
  name: 'fetch pack orders',
  auth: meliAuth,
  displayName: 'Fetch pack orders',
  description: 'Fetch pack orders; represents cart orders',
  props: {
    packId: Property.ShortText({
      displayName: 'Pack id',
      description: 'Identificador de paquete de órdenes',
      required: true,
    }),
  },
  async run(context) {
    const packId = context.propsValue.packId;
    const token = context.auth.access_token;

    if (packId !== '') {
      let cartOrders = await httpClient.sendRequest<Cart>({
        method: HttpMethod.GET,
        headers: { Authorization: `Bearer ${token} ` },
        url: `https://api.mercadolibre.com/packs/${packId}`,
      });
      let packs: string[] = [];
      let newPacks: string[] = [];
      packs = (await context.store.get(
        'packsProcessed',
        StoreScope.PROJECT
      )) as string[];
      if (packs !== null && !packs.includes(packId)) {
        //exists some packs processed
        await context.store.delete('packsProcessed', StoreScope.PROJECT);
        packs.map((p) => newPacks.push(p));
        newPacks.push(packId);
        await context.store.put('packsProcessed', newPacks, StoreScope.PROJECT);

        cartOrders.body.orders.forEach(async (o) => {
          const order = await httpClient.sendRequest<MLOrder>({
            method: HttpMethod.GET,
            headers: { Authorization: `Bearer ${token} ` },
            url: `https://api.mercadolibre.com/orders/${o.id}`,
          });
          const orderId = order.body.id as unknown as string;
          await context.store.put(`${orderId}`, order.body, StoreScope.FLOW);
        });
        await context.store.delete('newPack', StoreScope.PROJECT);
        await context.store.put('newPack', packId, StoreScope.PROJECT);
        return {
          cartOrders: cartOrders.body,
        };
      } else {
        if (packs === null) {
          //no packs processed
          await context.store.put(
            'packsProcessed',
            [packId],
            StoreScope.PROJECT
          );

          cartOrders.body.orders.forEach(async (o) => {
            const order = await httpClient.sendRequest<MLOrder>({
              method: HttpMethod.GET,
              headers: { Authorization: `Bearer ${token} ` },
              url: `https://api.mercadolibre.com/orders/${o.id}`,
            });
            const orderId = order.body.id as unknown as string;
            await context.store.put(`${orderId}`, order.body, StoreScope.FLOW);
          });
          await context.store.delete('newPack', StoreScope.PROJECT);
          await context.store.put('newPack', '', StoreScope.PROJECT);
        } else {
          await context.store.delete('newPack', StoreScope.PROJECT);
          await context.store.put('newPack', '', StoreScope.PROJECT);
        }
        return {
          cartOrders: cartOrders.body,
        };
      }
    } else {
      //pack already processed

      await context.store.delete('newPack', StoreScope.PROJECT);
      await context.store.put('newPack', '', StoreScope.PROJECT);
      return { cartOrders: null };
    }
  },
});
