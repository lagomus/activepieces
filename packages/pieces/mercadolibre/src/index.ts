import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { fetch_order } from './lib/actions/fetch-order';
import { fetch_order_shipment } from './lib/actions/fetch-order-shipping';
import { fetch_categories } from './lib/actions/fetch-categories';
import { fetch_attributes } from './lib/actions/fetch-attributes';
import { publish_products } from './lib/actions/publish-products';
import { fetch_review } from './lib/actions/fetch-review';
import { filter_order_inputs } from './lib/actions/filter-order-inputs';
import { fetch_pack_orders } from './lib/actions/fetch-pack-orders';

export const meliAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Mercadolibre API base path',
      description: 'Mercadolibre API base path',
      required: true,
      defaultValue: 'https://api.mercadolibre.com',
    }),
    access_token: PieceAuth.SecretText({
      displayName: 'Access Token',
      description: 'The access token for Mercadolibre integration',
      required: true,
    }),
  },
});

export const mercadolibre = createPiece({
  displayName: 'Mercadolibre',
  auth: meliAuth,
  minimumSupportedRelease: '0.1.0',
  logoUrl:
    'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.4.1/mercadolibre/logo__large_plus.png',
  authors: [],
  actions: [
    fetch_order,
    fetch_order_shipment,
    fetch_categories,
    fetch_attributes,
    publish_products,
    fetch_review,
    filter_order_inputs,
    fetch_pack_orders,
  ],
  triggers: [],
});
