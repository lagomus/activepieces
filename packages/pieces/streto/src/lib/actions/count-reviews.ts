import {
  createAction,
  StoreScope,
} from '@activepieces/pieces-framework';
import { stretoAuth } from '../..';

export const count_reviews_imported = createAction({
  name: 'count_reviews_imported',
  auth: stretoAuth,
  displayName: 'Count reviews imported',
  description: 'Count success and fails of imported review attributes',
  props: {
    
  },
  async run(context) {
    return {
      success: await context.store.get('successes', StoreScope.PROJECT),
      fails: await context.store.get('fails', StoreScope.PROJECT),
    }  
  },
  
});
