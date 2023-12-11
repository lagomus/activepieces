
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { fetch_top_stories } from "./lib/example";

export const streto = createPiece({
  displayName: "Streto",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.1.0',
  logoUrl: "https://streto.io/img/logo-ligth.png",
  authors: [],
  actions: [fetch_top_stories],
  triggers: [],
});
