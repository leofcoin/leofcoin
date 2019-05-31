import { define, RenderMixin, CSSMixin } from './../../shared-imports.js';

export default define(class WalletNameInput extends RenderMixin(CSSMixin(HTMLElement)) {
  get input() {
    return this.shadowRoot.querySelector('input')
  }
  get placeholder() {
    return 'type a name or just click the button and get a random name.';
  }
  constructor() {
    super()
    this.attachShadow({mode: 'open'})
  }

  connectedCallback() {
    super.connectedCallback()
  }

  onclick() {
    let name = this.input.value || Math.random().toString(36).slice(-8);
    this.dispatchEvent(new CustomEvent('name-change', {detail: name}))
  }

  get template() {
    return html`
    <style>
      :host {
        display: flex;
        align-items: center;
        padding: 6px 12px;
        box-sizing: border-box;
        width: 100%;
        height: 56px;
      }
      input {
        width: calc(100% - 100px);
        padding: 0.6em;
        border: none;
        border-bottom: 1px solid #eee;
        outline: none;
      }
    </style>
    <input></input>
    <span class="flex"></span>
    <custom-fab class="medium">v</custom-fab>
    `
  }
})
