import { define, merge, RenderMixin, PropertyMixin, CSSMixin } from './../../shared-imports.js';
import './../../../../node_modules/custom-button/src/custom-button.js';
// import socketRequestClient from '../../../node_modules/socket-request-client/src/index';

export default define(class WalletSend extends PropertyMixin(RenderMixin(CSSMixin(HTMLElement))) {
  static get properties() {
    return merge(super.properties, {})
  }

  set payto(value) {
    this.shadowRoot.querySelector('#payto').value = value
  }

  set amount(value) {
    this.shadowRoot.querySelector('#amount').value = value
  }

  get paywith() {
    return [window.address, ...window.account];
  }

  get payto() {
    return this.shadowRoot.querySelector('#payto').value
  }

  get amount() {
    return this.shadowRoot.querySelector('#amount').value
  }
  get _sendButton() {
    return this.shadowRoot.querySelector('.send-button')
  }
  constructor() {
    super();
    this.send = this.send.bind(this)
    this.cancel = this.cancel.bind(this)
    this.attachShadow({mode: 'open'})
  }

  connectedCallback(){
    super.connectedCallback()
    this._sendButton.addEventListener('click', this.send)
    this.shadowRoot.querySelector('.cancel-button').addEventListener('click', this.cancel)
  }

  cancel() {
    this.paywith = null;
    this.payto = null;
    this.amount = null;
  }

  async validate(paywith, payto, amount) {
    if (!paywith || !payto || !amount) throw Error('Are you sure you filled in everything?')
    // when payto address lenght is lower than or same as 24
    // we assume its an address name
    if (payto.length < 24) {
      const accounts = window.store.contacts;
      for (const acc of accounts) {
        if (acc[0] === payto) {
          payto = acc[1]
        }
      }
    }
    if (paywith.length < 34 || payto.length < 34) throw Error('invalid address')
    return {paywith, payto, amount};
  }

  async send() {
    await state('ready', true);
    if (this.paywith && this.payto && this.amount) {
      // TODO: push result to mempool
      try {
        const result = await this.validate(this.paywith[0], this.payto, this.amount)
        const sended = await send({
          to: this.payto,
          from: this.paywith,
          amount: this.amount,
          message: this.message
        })
      } catch (e) {
        alert(e.message)
      }
      return;
    }
    alert('Are you sure you filled in everything?');
  }

   get template() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: column;
        color: #ddd;
      }

      .send {
        padding: 2em;
      }
      input, textarea {
        /* padding: 0.6em; */
        border: none;
        outline: none;
        background: rgba(225,225,225,0.1);
        color: #ddd;
      }
      input {
        font-size: 20px;
        height: 40px;
        text-align: center;
        border-radius: 14px;
      }
      textarea#statement {
        font-size: 18px;
        height: calc(40px * 3);
        padding: 6px 12px;
        border-radius: 14px;
        overflow: hidden;
      }
      .item {
        mixin(--css-column)
        /* align-items: flex-end; */
        box-sizing: border-box;
        padding: 8px 16px;
      }

      h4 {
        margin: 0;
        padding: 0 12px 12px 0;
      }

      button {
        border: none;
        user-select: none;
        border-radius: 24px;
        height: 40px;
        width: 124px;
        background: transparent;
        user-select: none;
        outline: none;
        text-transform: uppercase;
        color: #ddd;
        cursor: pointer;
      }

      button:hover {
        box-shadow: var(--shadow-elevation-3dp);
        transition: box-shadow 96ms ease-in;
      }

      button:active {
        box-shadow: var(--shadow-elevation-0dp);
        transition: box-shadow 96ms ease-out;
      }

      input {
        color: #ddd;
      }
      .row {
        mixin(--css-row)
        align-items: center;
      }
      .lfc {
        padding: 0 0 0 12px;
      }
      apply(--css-flex)
      apply(--css-flex-2)

      [disabled] {
        pointer-events: none;
        color: #eee;
      }
    </style>
    <span class="row">
      <span class="item">
        <h4>SEND</h4>
        <span class="row">
          <input id="amount" type="text" autocomplete="off" placeholder="150" tabindex="1"></input>
        </span>
      </span>
      <span class="item">
        <span class="flex">
          <h4>TO</h4>
          <input id="payto" type="text" autocomplete="on" placeholder="address/contact" tabindex="2"></input>
        </span>
      </span>
    </span>
    <span class="flex"></span>
    <span class="item">
      <h4 for="statement">STATEMENT (optional)</h4>
      <textarea id="statement" placeholder="some words" tabindex="3"></textarea>
    </span>
    <span class="flex-2"></span>
    <span class="row">
      <custom-button class="cancel-button" tabindex="5">cancel</custom-button>
      <span class="flex"></span>
      <custom-button class="send-button" tabindex="4">send</custom-button>
    </span>
    `;
  }
});
