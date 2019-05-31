import { define, merge, RenderMixin, PropertyMixin } from './../../shared-imports.js';

/**
 *
 */
export default define(class WalletAddressName extends PropertyMixin(RenderMixin(HTMLElement)) {
  static get properties() {
    return merge(super.properties, {
      value: {
        reflect: true,
        value: '',
        observer: 'ob'
      }
    })
  }
  constructor() {
    super();
    this.attachShadow({mode: 'open'})
  }
  ob() {
      this.innerHTML = this.value
  }

  get template() {
    return html`
    <style>
      :host {
        display: block;
        width: 90px;
      }
    </style>
    <slot></slot>
    `
  }
});
