import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { fetch_order } from "./lib/actions/fetch-order";
import { fetch_order_shipment } from "./lib/actions/fetch-order-shipping";

export const meliAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://auth.mercadolibre.com.ar/authorization',
  tokenUrl: 'https://api.mercadolibre.com/oauth/token',
  required: true,
  scope: [
    'read',
    'write'
  ],
})

export const mercadolibre = createPiece({
  displayName: "Mercadolibre",
  auth: meliAuth,
  minimumSupportedRelease: '0.1.0',
  logoUrl: "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.4.1/mercadolibre/logo__large_plus.png",
  authors: [],
  actions: [fetch_order, fetch_order_shipment],
  triggers: [],
});
