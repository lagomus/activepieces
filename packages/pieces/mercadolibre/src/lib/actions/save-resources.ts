import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import { meliAuth } from '../..';
import { Resource } from '../common/models';

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
        StoreScope.FLOW
      );
      if (orders !== null && orders.length > 0) {
        const newOrders = removeDuplicates(orders,orderNumber)
        newOrder = true;
        await context.store.put('orders', newOrders, StoreScope.FLOW);
      }
      else {
        await context.store.put('orders', [orderNumber], StoreScope.FLOW);
        newOrder = true;
      }
    }
    return {
      topic: topic,
      order: newOrder ? "newOrder" : "already exists or topic not valid",
    };
  },
});

function removeDuplicates(sourceList: any[], itemField: string) {
  const seen = new Set();
  return sourceList.filter((item) => {
    const value = item[itemField];
    if (seen.has(value)) {
      return false;
    } else {
      seen.add(value);
      return true;
    }
  });
}