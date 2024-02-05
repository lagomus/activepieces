import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import { meliAuth } from '../..';
import { Resource } from '../common/models';
import { isEmpty } from '@activepieces/shared';

export const save_resources = createAction({
  name: 'save resources',
  auth: meliAuth,
  displayName: 'Save resources',
  description: 'Save resources from ML webhook request body in database',
  props: {
    resources: Property.Json({
      displayName: 'Resources',
      description:
        'External resources information that trigger captures initially',
      required: true,
    }),
    topic: Property.ShortText({
      displayName: 'Topic',
      description: 'Topic for filter by',
      required: false,
      defaultValue: 'orders_v2',
    }),
  },
  async run(context) {
    const resources = context.propsValue['resources'] as unknown as Resource;
    const topic = context.propsValue['topic'];
    let newOrder = false;

    if (resources.topic === topic) {
      const orderNumber = resources.resource.split('/')[2];
      const orders = await context.store.get<string[]>(
        'orders',
        StoreScope.PROJECT
      );
      if (orders !== null && !isEmpty(orders)) {
        let newOrders: string[] = orders;
        if (!orders.includes(orderNumber)) {
          newOrders.push(orderNumber);
        }
        await context.store.delete('orders', StoreScope.PROJECT);
        await context.store.put('orders', newOrders, StoreScope.PROJECT);
      } else {
        await context.store.put('orders', [orderNumber], StoreScope.PROJECT);
      }
    }
    return {
      topic: topic,
      orders: await context.store.get('orders', StoreScope.PROJECT),
    };
  },
});
