import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { fetch_products } from './lib/actions/fetch-products';
import { fetch_catalog_id } from './lib/actions/fetch-catalog';

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
  actions: [fetch_products, fetch_catalog_id],
  triggers: [],
});
