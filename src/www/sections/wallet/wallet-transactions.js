import { define, merge, RenderMixin, PropertyMixin, CSSMixin } from './../../shared-imports.js';
// import socketRequestClient from '../../../node_modules/socket-request-client/src/index';

export default define(class WalletTransactions extends CSSMixin(RenderMixin(PropertyMixin(HTMLElement))) {
  static get properties() {
    return merge(super.properties, {})
  }
  constructor() {
    super();
    this.attachShadow({mode: 'open'})
  }
  connectedCallback() {
    super.connectedCallback();
    // this.client = await socketRequestClient(6000, 'echo-protocol');

    // this.client.on('wallet/transactions', transactions => {
    // // this.render();
    // });
    // this.client.send({ url: 'wallet/transactions' params: {
    //   address:
    // }})

  }
  get template() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: column;
      }
      apply(--css-row)
      apply(--css-flex)
      apply(--css-flex-2)
    </style>
    `;
  }
});
