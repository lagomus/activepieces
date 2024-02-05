import {
  createAction,
  StoreScope,
} from '@activepieces/pieces-framework';
import { meliAuth } from '../..';

export const fetch_cart_orders = createAction({
  name: 'fetch cart orders',
  auth: meliAuth,
  displayName: 'Fetch cart orders',
  description:
    'Fetch Cart Orders',
  props: {
    
  },
  async run(context) {
    return (await context.store.get("orders",StoreScope.PROJECT));
  },
});
