import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import { meliAuth } from '../..';
import { Resource } from '../common/models';
import { isEmpty } from '@activepieces/shared';

export const filter_order_inputs = createAction({
  name: 'filter order inputs',
  auth: meliAuth,
  displayName: 'Filter order inputs',
  description: 'Filter topic and filter if not processed order number',
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
    const resources = context.propsValue.resources as unknown as Resource;
    const topic = context.propsValue.topic;

    if (resources.topic === topic) {
      const orderNumber = resources.resource.split('/')[2];
      const orders = await context.store.get<string[]>(
        'ordersProcessed',
        StoreScope.PROJECT
      );
      if (orders !== null && !isEmpty(orders)) {
        if (!orders.includes(orderNumber)) {
          return {
            topic: topic,
            newOrder: orderNumber,
          };
        } else {
          return { newOrder: '' };
        }
      } else {
        return {
          topic: topic,
          newOrder: orderNumber,
        };
      }
    } else {
      return {
        topic: 'not expected topic',
        newOrder: '',
      };
    }
  },
});
