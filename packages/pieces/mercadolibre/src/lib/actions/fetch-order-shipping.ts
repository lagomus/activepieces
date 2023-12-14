import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { meliAuth } from "../..";

export const fetch_order_shipment = createAction({
  name: 'fetch_order_shipment', // Must be a unique across the piece, this shouldn't be changed.
    auth: meliAuth,
    displayName:'Fetch Order Shipment',
    description: 'Fetch shipment data from Mercado Libre order',
  props: {
    orderId: Property.ShortText({
      displayName: 'Order Id',
      description: "Identificador de órden",
      required: true,
    })
  },
  async run(context) {
    const orderId = context.propsValue['orderId'];
    const token = context.auth.access_token;

    let orderShipment:any = {};
    const orderShipmentCall:any = await httpClient.sendRequest<string[]>({
      method: HttpMethod.GET,
      headers: {Authorization: `Bearer ${token} `},
      url: `https://api.mercadolibre.com/orders/${orderId}/shipments`,
    }).then(r => orderShipment = r.status === 200 ? r : {} )
    .catch(() => {return {}} )
    return {
      orderShipment
    }
  },
});
