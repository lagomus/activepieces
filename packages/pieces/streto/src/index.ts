import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { fetch_products } from './lib/actions/fetch-products';
import { fetch_catalog_id } from './lib/actions/fetch-catalog-id';
import { generate_pricelist } from './lib/actions/generate-pricelist';
import { fetch_settings } from './lib/actions/fetch-settings';
import { import_order } from './lib/actions/import-order';
import { count_products } from './lib/actions/count-products';
import { build_pages } from './lib/actions/build-pages';
import { save_attributes } from './lib/actions/save-attributes';
import { import_reviews_data } from './lib/actions/import-reviews-data';
import { count_reviews_imported } from './lib/actions/count-reviews';

const authMarkdown = `
To generate an API key, follow the steps below in Streto Admin:
1. Go to Administration -> API Keys -> Integrations.
2. click Create API key.
3. Enter the required values and confirm.
4. Copy the API Key into the field below.
`;

export const stretoAuth = PieceAuth.CustomAuth({
  description: authMarkdown,
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Streto Core URL',
      description: 'The Streto core URL (https://core-dev.streto.tienda)',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'The API key for your integration',
      required: true,
    }),
  },
});

export const streto = createPiece({
  displayName: 'Streto',
  auth: stretoAuth,
  minimumSupportedRelease: '0.1.0',
  logoUrl: 'https://streto.io/img/logo-ligth.png',
  authors: [],
  actions: [
    fetch_products,
    fetch_catalog_id,
    generate_pricelist,
    fetch_settings,
    import_order,
    build_pages,
    count_products,
    save_attributes,
    import_reviews_data,
    count_reviews_imported
  ],
  triggers: [],
});
