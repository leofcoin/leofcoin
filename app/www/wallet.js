import { d as define, e as merge, f as PropertyMixin, b as RenderMixin, c as CSSMixin, g as SelectorMixin } from './chunk-30a2cd27.js';
import './chunk-b1de7dde.js';
import './chunk-87e8379e.js';

// import socketRequestClient from '../node_modules/socket-request-client/src/index';

define(class WalletAddressBalance extends HTMLElement {

  set address(value) {
    this._address = value;
    (async () => {
      const index = this.getAttribute('chain-index');
      if (index) this.balance = await leofcoin.api.balanceAfter(this.address, index);
      else this.balance = await leofcoin.api.balance(this.address);
    })();
  }

  get address() {
    return this._address;
  }

  set balance(value) {
    this._balance = value;
    (async () => {
      this.innerHTML = String(value);

      const block = await leofcoin.api.block();
      console.log(block);
      this.setAttribute('chain-index', block.index);
    })();
  }

  get balance() {
    return this._balance;
  }

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
        }
      </style>
      <slot>
        <busy-animation></busy-animation>
      </slot>
    `;
  }


});

define(class walletAccount extends CSSMixin(RenderMixin(HTMLElement)) {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  set address(value) {
    if (value) {
      this._address = value;
    }
  }

  set account(value) {
    this.index = value[0];
    this.setAttribute('data-route', this.index);
    this.name = leofcoin.api.accountNames[this.index];
    if (!this.name) this.name = value[1];
    this.address = value[2][0];
    console.log(value);
    this.title = `external address: ${value[2][0]}\ninternal address: ${value[2][1]}`;
    this.updateBalance();
  }

  get address() {
    return this._address;
  }

  get walletAddressBalance() {
    return this.shadowRoot.querySelector('wallet-address-balance')
  }

  async updateBalance() {
    await leofcoin.api.state('ready', true);
    this.walletAddressBalance.address = this.address;
    // this.balance = await balance(this.address);
    // this.balance = String(this.balance);
    this.observer();
  }

  observer() {
    if (this.name) {
      this.render({name: this.name});
    }
  }

  get template() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: row;
          cursor: pointer;
          /* border: 1px solid rgba(0,0,0, 0.78); */
          box-sizing: border-box;
          width: 100%;
          color: #ddd;
          padding: 12px;
          --svg-icon-color: #ddd;
          --svg-icon-size: 40px;
          align-items: center;
          text-transform: uppercase;
          user-select: none;
          outline: none;
          pointer-events: auto;
        }

        :not(:host) {
          pointer-events: none;
        }

        .column {
          padding-left: 12px;
          width: 100%;
          mixin(--css-column)
        }

        .lfc {
          padding-left: 6px;
        }

        apply(--css-row)
        apply(--css-flex)

        :host(.custom-selected) {
          background: #5557618a;
        }
      </style>

      <custom-svg-icon icon="wallet"></custom-svg-icon>
      <span class="column">
        <span class="address">${'name'}</span>
        <span class="row">
          <wallet-address-balance></wallet-address-balance>
          <strong class="lfc">LFC</strong>
        </span>
      </span>
    `;
  }
});

define(class walletAccounts extends RenderMixin(CSSMixin(SelectorMixin(HTMLElement))) {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.selected = 0;
    this._onBlockAdded = this._onBlockAdded.bind(this);
    bus.on('block-added', this._onBlockAdded);
  }

  _onBlockAdded() {
    const accounts = this.shadowRoot.querySelector('slot').assignedElements();
    accounts.forEach(acc => acc.updateBalance());
  }

  onSelect() {
    // const index = this.accounts.indexOf(this.selected);
    // this.dispatchEvent('load-wallet', this.accounts[index])
    // this.accounts[index];
  }

  add(account) {
    const el = document.createElement('wallet-account');
    el.account = account;
    this.appendChild(el);
    // this.accounts.push([address, account]);
  }

  get template() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          pointer-events: none;
        }

        .custom-selected {
          background: #5557618a;
        }

        apply(--css-flex)
      </style>
      <slot></slot>
      <span class="flex"></span>
    `;
  }
});

// import socketRequestClient from '../../../node_modules/socket-request-client/src/index';

define(class WalletTransactions extends CSSMixin(RenderMixin(PropertyMixin(HTMLElement))) {
  static get properties() {
    return merge(super.properties, {})
  }
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
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

define(class WalletNameInput extends RenderMixin(CSSMixin(HTMLElement)) {
  get input() {
    return this.shadowRoot.querySelector('input')
  }
  get placeholder() {
    return 'type a name or just click the button and get a random name.';
  }
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  connectedCallback() {
    super.connectedCallback();
  }

  onclick() {
    let name = this.input.value || Math.random().toString(36).slice(-8);
    this.dispatchEvent(new CustomEvent('name-change', {detail: name}));
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
});

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var customUtil = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });

const WHITE_SPACES = [
    ' ', '\n', '\r', '\t', '\f', '\v', '\u00A0', '\u1680', '\u180E',
    '\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005', '\u2006',
    '\u2007', '\u2008', '\u2009', '\u200A', '\u2028', '\u2029', '\u202F',
    '\u205F', '\u3000'
];

/**
 * Add space between camelCase text.
 */
var unCamelCase = (string) => {
  string = string.replace(/([a-z\xE0-\xFF])([A-Z\xC0\xDF])/g, '$1 $2');
  string = string.toLowerCase();
  return string;
};

/**
* Replaces all accented chars with regular ones
*/
var replaceAccents = (string) => {
  // verifies if the String has accents and replace them
  if (string.search(/[\xC0-\xFF]/g) > -1) {
      string = string
              .replace(/[\xC0-\xC5]/g, 'A')
              .replace(/[\xC6]/g, 'AE')
              .replace(/[\xC7]/g, 'C')
              .replace(/[\xC8-\xCB]/g, 'E')
              .replace(/[\xCC-\xCF]/g, 'I')
              .replace(/[\xD0]/g, 'D')
              .replace(/[\xD1]/g, 'N')
              .replace(/[\xD2-\xD6\xD8]/g, 'O')
              .replace(/[\xD9-\xDC]/g, 'U')
              .replace(/[\xDD]/g, 'Y')
              .replace(/[\xDE]/g, 'P')
              .replace(/[\xE0-\xE5]/g, 'a')
              .replace(/[\xE6]/g, 'ae')
              .replace(/[\xE7]/g, 'c')
              .replace(/[\xE8-\xEB]/g, 'e')
              .replace(/[\xEC-\xEF]/g, 'i')
              .replace(/[\xF1]/g, 'n')
              .replace(/[\xF2-\xF6\xF8]/g, 'o')
              .replace(/[\xF9-\xFC]/g, 'u')
              .replace(/[\xFE]/g, 'p')
              .replace(/[\xFD\xFF]/g, 'y');
  }

  return string;
};

var removeNonWord = (string) => string.replace(/[^0-9a-zA-Z\xC0-\xFF \-]/g, '');

/**
* Remove chars from beginning of string.
*/
var ltrim = (string, chars) => {
  chars = chars || WHITE_SPACES;

  let start = 0,
      len = string.length,
      charLen = chars.length,
      found = true,
      i, c;

  while (found && start < len) {
      found = false;
      i = -1;
      c = string.charAt(start);

      while (++i < charLen) {
          if (c === chars[i]) {
              found = true;
              start++;
              break;
          }
      }
  }

  return (start >= len) ? '' : string.substr(start, len);
};

/**
* Remove chars from end of string.
*/
var rtrim = (string, chars) => {
  chars = chars || WHITE_SPACES;

  var end = string.length - 1,
      charLen = chars.length,
      found = true,
      i, c;

  while (found && end >= 0) {
      found = false;
      i = -1;
      c = string.charAt(end);

      while (++i < charLen) {
          if (c === chars[i]) {
              found = true;
              end--;
              break;
          }
      }
  }

  return (end >= 0) ? string.substring(0, end + 1) : '';
};

/**
 * Remove white-spaces from beginning and end of string.
 */
var trim = (string, chars) => {
  chars = chars || WHITE_SPACES;
  return ltrim(rtrim(string, chars), chars);
};

/**
 * Convert to lower case, remove accents, remove non-word chars and
 * replace spaces with the specified delimeter.
 * Does not split camelCase text.
 */
var slugify = (string, delimeter) => {
  if (delimeter == null) {
      delimeter = "-";
  }

  string = replaceAccents(string);
  string = removeNonWord(string);
  string = trim(string) //should come after removeNonWord
          .replace(/ +/g, delimeter) //replace spaces with delimeter
          .toLowerCase();
  return string;
};

/**
* Replaces spaces with hyphens, split camelCase text, remove non-word chars, remove accents and convert to lower case.
*/
var hyphenate = string => {
  string = unCamelCase(string);
  return slugify(string, "-");
};

exports.WHITE_SPACES = WHITE_SPACES;
exports.hyphenate = hyphenate;
exports.ltrim = ltrim;
exports.removeNonWord = removeNonWord;
exports.replaceAccents = replaceAccents;
exports.rtrim = rtrim;
exports.slugify = slugify;
exports.trim = trim;
exports.unCamelCase = unCamelCase;
});

unwrapExports(customUtil);
var customUtil_1 = customUtil.WHITE_SPACES;
var customUtil_2 = customUtil.hyphenate;
var customUtil_3 = customUtil.ltrim;
var customUtil_4 = customUtil.removeNonWord;
var customUtil_5 = customUtil.replaceAccents;
var customUtil_6 = customUtil.rtrim;
var customUtil_7 = customUtil.slugify;
var customUtil_8 = customUtil.trim;
var customUtil_9 = customUtil.unCamelCase;

const shouldDefine = name => customElements.get(name) ? false : true;

var define$1 = klass => {
  if (!klass) return console.error('class undefined');
  if (!klass.constructor) return console.error('constructor required');
  if (!klass.name) return console.error('class name required');

  const name = customUtil_2(klass.name);
  return shouldDefine(name) ? customElements.define(name, klass) : '';
};

define$1(class CustomButton extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({mode: 'open'});

    this.shadowRoot.innerHTML = `
    <style>
      :host {
        --shadow-elevation-0dp:
                    0 0px 0px 0 rgba(0, 0, 0, 0.14),
                    0 0px 0px 0 rgba(0, 0, 0, 0.12),
                    0 0px 0px 0px rgba(0, 0, 0, 0.2);
        --shadow-elevation-3dp:
                    0 3px 4px 0 rgba(0, 0, 0, 0.14),
                    0 1px 8px 0 rgba(0, 0, 0, 0.12),
                    0 3px 3px -2px rgba(0, 0, 0, 0.4);
        --custom-button-height: 40px;
        display: block;
        width: 124px;
        height: var(--custom-button-height);
        pointer-events: auto;
        cursor: pointer;
        border-radius: calc(var(--custom-button-height) / 3);
      }

      button {
        pointer-events: show;
        display: block;
        width: 124px;
        height: var(--custom-button-height);
        border: none;
        border-radius: calc(var(--custom-button-height) / 3);
        user-select: none;
        outline: none;
        text-transform: uppercase;
        background: transparent;
        color: #ddd;
        cursor: pointer;
      }

      button:hover {
        box-shadow: var(--shadow-elevation-3dp);
        transition: box-shadow 16ms ease-in;
        background: #3f435452;
        /* color: #333; */
      }

      button:active {
        box-shadow: var(--shadow-elevation-0dp);
        transition: box-shadow 96ms ease-out;
        background: transparent;
        /* color: #ddd; */
      }
    </style>
    <button><slot></slot></button>
    `;
  }
});

// import socketRequestClient from '../../../node_modules/socket-request-client/src/index';

define(class WalletSend extends PropertyMixin(RenderMixin(CSSMixin(HTMLElement))) {
  static get properties() {
    return merge(super.properties, {})
  }

  set payto(value) {
    this.shadowRoot.querySelector('#payto').value = value;
  }

  set amount(value) {
    this.shadowRoot.querySelector('#amount').value = value;
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
    this.send = this.send.bind(this);
    this.cancel = this.cancel.bind(this);
    this.attachShadow({mode: 'open'});
  }

  connectedCallback(){
    super.connectedCallback();
    this._sendButton.addEventListener('click', this.send);
    this.shadowRoot.querySelector('.cancel-button').addEventListener('click', this.cancel);
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
          payto = acc[1];
        }
      }
    }
    if (paywith.length < 34 || payto.length < 34) throw Error('invalid address')
    return {paywith, payto, amount};
  }

  async send() {
    await leofcoin.api.state('ready', true);
    if (this.paywith && this.payto && this.amount) {
      // TODO: push result to mempool
      try {
        const result = await this.validate(this.paywith[0], this.payto, this.amount);
        const sended = await leofcoin.api.send({
          to: this.payto,
          from: this.paywith,
          amount: this.amount,
          message: this.message
        });

        console.log(sended);
        const length = sended.hash.length;
        const hash = sended.hash.slice((length - 7), length);
        console.log(hash, sended.hash);
        const permission = await Notification.requestPermission();
        if (permission === "granted") {

          new Notification(`${hash} signed & added to pool`, {icon: './assets/leofcoin_96.png', badge: './assets/leofcoin_96.png'}).onclick = (ev) => {
            ev.preventDefault();
            console.log(ev);
          };
        }
      } catch (e) {
        return alert(e.message);
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

// import socketRequestClient from '../../../node_modules/socket-request-client/src/index';

define(class WalletReceive extends PropertyMixin(RenderMixin(CSSMixin(HTMLElement))) {
  static get properties() {
    return merge(super.properties, {})
  }

  set payto(value) {
    this.shadowRoot.querySelector('#payto').value = value;
  }

  set amount(value) {
    this.shadowRoot.querySelector('#amount').value = value;
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
    this.send = this.send.bind(this);
    this.cancel = this.cancel.bind(this);
    this.attachShadow({mode: 'open'});
  }

  connectedCallback(){
    super.connectedCallback();
    this._sendButton.addEventListener('click', this.send);
    this.shadowRoot.querySelector('.cancel-button').addEventListener('click', this.cancel);
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
          payto = acc[1];
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
        const result = await this.validate(this.paywith[0], this.payto, this.amount);
        const sended = await send({
          to: this.payto,
          from: this.paywith,
          amount: this.amount,
          message: this.message
        });

        console.log(sended);
        const length = sended.hash.length;
        const hash = sended.hash.slice((length - 7), length);
        console.log(hash, sended.hash);
        const permission = await Notification.requestPermission();
        if (permission === "granted") {

          new Notification(`${hash} signed & added to pool`, {icon: '/assets/leofcoin_96.png', badge: '/assets/leofcoin_96.png'}).onclick = (ev) => {
            ev.preventDefault();
            console.log(ev);
          };
        }
      } catch (e) {
        return alert(e.message);
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
        <h4>RECEIVE</h4>
        <span class="row">
          <input id="amount" type="text" autocomplete="off" placeholder="150" tabindex="1"></input>
        </span>
      </span>
      <span class="item">
        <span class="flex">
          <h4>FROM</h4>
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

var CustomButton = (function () {

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var customUtil = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, '__esModule', { value: true });

	const WHITE_SPACES = [
	    ' ', '\n', '\r', '\t', '\f', '\v', '\u00A0', '\u1680', '\u180E',
	    '\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005', '\u2006',
	    '\u2007', '\u2008', '\u2009', '\u200A', '\u2028', '\u2029', '\u202F',
	    '\u205F', '\u3000'
	];

	/**
	 * Add space between camelCase text.
	 */
	var unCamelCase = (string) => {
	  string = string.replace(/([a-z\xE0-\xFF])([A-Z\xC0\xDF])/g, '$1 $2');
	  string = string.toLowerCase();
	  return string;
	};

	/**
	* Replaces all accented chars with regular ones
	*/
	var replaceAccents = (string) => {
	  // verifies if the String has accents and replace them
	  if (string.search(/[\xC0-\xFF]/g) > -1) {
	      string = string
	              .replace(/[\xC0-\xC5]/g, 'A')
	              .replace(/[\xC6]/g, 'AE')
	              .replace(/[\xC7]/g, 'C')
	              .replace(/[\xC8-\xCB]/g, 'E')
	              .replace(/[\xCC-\xCF]/g, 'I')
	              .replace(/[\xD0]/g, 'D')
	              .replace(/[\xD1]/g, 'N')
	              .replace(/[\xD2-\xD6\xD8]/g, 'O')
	              .replace(/[\xD9-\xDC]/g, 'U')
	              .replace(/[\xDD]/g, 'Y')
	              .replace(/[\xDE]/g, 'P')
	              .replace(/[\xE0-\xE5]/g, 'a')
	              .replace(/[\xE6]/g, 'ae')
	              .replace(/[\xE7]/g, 'c')
	              .replace(/[\xE8-\xEB]/g, 'e')
	              .replace(/[\xEC-\xEF]/g, 'i')
	              .replace(/[\xF1]/g, 'n')
	              .replace(/[\xF2-\xF6\xF8]/g, 'o')
	              .replace(/[\xF9-\xFC]/g, 'u')
	              .replace(/[\xFE]/g, 'p')
	              .replace(/[\xFD\xFF]/g, 'y');
	  }

	  return string;
	};

	var removeNonWord = (string) => string.replace(/[^0-9a-zA-Z\xC0-\xFF \-]/g, '');

	/**
	* Remove chars from beginning of string.
	*/
	var ltrim = (string, chars) => {
	  chars = chars || WHITE_SPACES;

	  let start = 0,
	      len = string.length,
	      charLen = chars.length,
	      found = true,
	      i, c;

	  while (found && start < len) {
	      found = false;
	      i = -1;
	      c = string.charAt(start);

	      while (++i < charLen) {
	          if (c === chars[i]) {
	              found = true;
	              start++;
	              break;
	          }
	      }
	  }

	  return (start >= len) ? '' : string.substr(start, len);
	};

	/**
	* Remove chars from end of string.
	*/
	var rtrim = (string, chars) => {
	  chars = chars || WHITE_SPACES;

	  var end = string.length - 1,
	      charLen = chars.length,
	      found = true,
	      i, c;

	  while (found && end >= 0) {
	      found = false;
	      i = -1;
	      c = string.charAt(end);

	      while (++i < charLen) {
	          if (c === chars[i]) {
	              found = true;
	              end--;
	              break;
	          }
	      }
	  }

	  return (end >= 0) ? string.substring(0, end + 1) : '';
	};

	/**
	 * Remove white-spaces from beginning and end of string.
	 */
	var trim = (string, chars) => {
	  chars = chars || WHITE_SPACES;
	  return ltrim(rtrim(string, chars), chars);
	};

	/**
	 * Convert to lower case, remove accents, remove non-word chars and
	 * replace spaces with the specified delimeter.
	 * Does not split camelCase text.
	 */
	var slugify = (string, delimeter) => {
	  if (delimeter == null) {
	      delimeter = "-";
	  }

	  string = replaceAccents(string);
	  string = removeNonWord(string);
	  string = trim(string) //should come after removeNonWord
	          .replace(/ +/g, delimeter) //replace spaces with delimeter
	          .toLowerCase();
	  return string;
	};

	/**
	* Replaces spaces with hyphens, split camelCase text, remove non-word chars, remove accents and convert to lower case.
	*/
	var hyphenate = string => {
	  string = unCamelCase(string);
	  return slugify(string, "-");
	};

	exports.WHITE_SPACES = WHITE_SPACES;
	exports.hyphenate = hyphenate;
	exports.ltrim = ltrim;
	exports.removeNonWord = removeNonWord;
	exports.replaceAccents = replaceAccents;
	exports.rtrim = rtrim;
	exports.slugify = slugify;
	exports.trim = trim;
	exports.unCamelCase = unCamelCase;
	});

	unwrapExports(customUtil);
	var customUtil_1 = customUtil.WHITE_SPACES;
	var customUtil_2 = customUtil.hyphenate;
	var customUtil_3 = customUtil.ltrim;
	var customUtil_4 = customUtil.removeNonWord;
	var customUtil_5 = customUtil.replaceAccents;
	var customUtil_6 = customUtil.rtrim;
	var customUtil_7 = customUtil.slugify;
	var customUtil_8 = customUtil.trim;
	var customUtil_9 = customUtil.unCamelCase;

	const shouldDefine = name => customElements.get(name) ? false : true;

	var define$$1 = klass => {
	  if (!klass) return console.error('class undefined');
	  if (!klass.constructor) return console.error('constructor required');
	  if (!klass.name) return console.error('class name required');

	  const name = customUtil_2(klass.name);
	  return shouldDefine(name) ? customElements.define(name, klass) : '';
	};

	var customButton = define$$1(class CustomButton extends HTMLElement {
	  constructor() {
	    super();

	    this.attachShadow({mode: 'open'});

	    this.shadowRoot.innerHTML = `
    <style>
      :host {
        --shadow-elevation-0dp:
                    0 0px 0px 0 rgba(0, 0, 0, 0.14),
                    0 0px 0px 0 rgba(0, 0, 0, 0.12),
                    0 0px 0px 0px rgba(0, 0, 0, 0.2);
        --shadow-elevation-3dp:
                    0 3px 4px 0 rgba(0, 0, 0, 0.14),
                    0 1px 8px 0 rgba(0, 0, 0, 0.12),
                    0 3px 3px -2px rgba(0, 0, 0, 0.4);
        --custom-button-height: 40px;
        display: block;
        width: 124px;
        height: var(--custom-button-height);
        pointer-events: auto;
        cursor: pointer;
        border-radius: calc(var(--custom-button-height) / 3);
      }

      button {
        pointer-events: show;
        display: block;
        width: 124px;
        height: var(--custom-button-height);
        border: none;
        border-radius: calc(var(--custom-button-height) / 3);
        user-select: none;
        outline: none;
        text-transform: uppercase;
        background: transparent;
        color: #ddd;
        cursor: pointer;
      }

      button:hover {
        box-shadow: var(--shadow-elevation-3dp);
        transition: box-shadow 16ms ease-in;
        background: #3f435452;
        /* color: #333; */
      }

      button:active {
        box-shadow: var(--shadow-elevation-0dp);
        transition: box-shadow 96ms ease-out;
        background: transparent;
        /* color: #ddd; */
      }
    </style>
    <button><slot></slot></button>
    `;
	  }
	});

	return customButton;

}());

define(class CustomFab extends PropertyMixin(HTMLElement) {
  static get properties() {
    return merge(super.properties, {})
  }
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = `
      <style>
      :host {
        display: flex;
        height: 54px;
        width: 54px;
        background: #4ab198;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: #FFF;
        border: none;
        border-radius: 50%;
        user-select: none;
        pointer-events: auto;
        cursor: pointer;
        outline: none;
        box-shadow: var(--shadow-elevation-6dp);
      }
      :host(.pressed) {
        box-shadow: var(--shadow-elevation-2dp);
      }
      :host(.right), :host(.bottom) {
        position: absolute;
      }
      :host(.right) {
        right: 32px;
      }
      :host(.bottom) {
        bottom: 32px;
      }
      :host(.medium) {
        font-size: 18px;
        height: 40px;
        width: 40px;
      }
      </style>
      <slot></slot>
    `;
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('mousedown', event => {
      this.classList.add('pressed');
    });
    this.addEventListener('mouseup', event => {
      this.classList.remove('pressed');
    });
  }
});

// import socketRequestClient from '../../../node_modules/socket-request-client/src/index';

var wallet = define(class WalletSection extends RenderMixin(CSSMixin(HTMLElement)) {

  get _accountsEl() {
    return this.shadowRoot.querySelector('wallet-accounts');
  }

  get pages() {
    return this.shadowRoot.querySelector('custom-pages');
  }

  get fab() {
    return this.shadowRoot.querySelector('custom-fab');
  }

  get _extendedFab() {
    return this.shadowRoot.querySelector('extended-fab')
  }
  constructor() {
    super();
    this.attachShadow({mode: 'open'});

    this.addresses = [];
  }

  connectedCallback() {
    super.connectedCallback();
    (async () => {
      try {
        // TODO: await addresses() --> accounts()
        console.log('a');
        console.log(await leofcoin.api.addresses());
        console.log('z');
        this.accounts = await leofcoin.api.addresses();
        if (this.accounts) {
          this._extendedFab.label = 'create account';
          this._extendedFab.onclick = () => this.createAccount();
          console.log(this.accounts);
          for (const acc of this.accounts) {
            for (const address of acc[1]) {
              this.addresses.push(address);
            }
          }
          window.store.addresses = this.addresses;

          this.setAccounts();
        } else {
          this._extendedFab.label = 'create wallet';
          this._extendedFab.onclick = () => this.createWallet();
        }
      } catch (e) {
        alert(e);
      }
    })();
  }

  setAccounts() {
    window.store.contacts = [...window.store.contacts, ...this.accounts];
    for (var i = 0; i < this.accounts.length; i++) {
      this._accountsEl.add([i, ...this.accounts[i]]);
    }
    this._accountsEl.selected = 1;
    this._accountsEl.selected = 0;
    // window.address = this.accounts[0][1];
    this.accountSelected();
    document.dispatchEvent(new CustomEvent('wallet-loaded-data', {detail: this.accounts}));
  }

  accountSelected() {
    window.address = this.accounts[this._accountsEl.selected][1][0];
    window.account = this.accounts[this._accountsEl.selected];
    this.render({address: window.address});
  }

  async createAccount() {
    const nameInput = document.createElement('wallet-name-input');
    nameInput.addEventListener('name-change', async ({detail}) => {
      leofcoin.api.createAccount();
      // const response = await fetch(`http://localhost:5005/core/new-address?name=${detail}`);
      // const address = await response.json()
      this.add(address);
      this.classList.remove('name-input-open');
      this.shadowRoot.removeChild(nameInput);
    });
    this.classList.add('name-input-open');
    this.shadowRoot.appendChild(nameInput);
  }

  async createWallet() {
    console.log('w');
    const result = await leofcoin.api.createWallet();
    console.log(result.mnemonic);
    alert(`Wallet generated\nplease note mnemonic down\nnote, losing results in an unrecoverable wallet\n\n${result.mnemonic}`);
    this.accounts = await leofcoin.api.accounts();
    this.setAccounts();
  }

  selectedChanged({detail}) {
    this.pages.selected = detail;
  }

  get template() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: row;
          overflow-y: auto;
          position: relative;
          width: 100%;
        }

        wallet-accounts {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: calc(100% - 40px);
        }
        .toolbar {
          display: flex;
          width: 100%;
          height: 48px;
          box-sizing: border-box;
          padding-top: 2px;
          background: #2b2e3b;
          color: #eee;
          height: 64px;
          --svg-icon-color: #ddd;
        }
        .hero {
          display: flex;
          max-width: 600px;
          max-height: 400px;
          height: 100%;
          width: 100%;
          box-shadow: var(--shadow-elevation-6dp);
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border-radius: 18px;
          background: #ffffff08;
          color: #ddd;
          padding: 24px;
          box-sizing: border-box;
        }
        strong {
          margin: 0;
        }

        .hidden {
          opacity: 0;
          pointer-events: 0;
          z-index: 0;
        }
        .column {
          width: 100%;
          height: 100%;
          mixin(--css-column)
        }

        .column.accounts {
          width: 265px;
          border-right: 1px solid rgba(0,0,0,0.48);
          background: #3f435452;
          padding: 8px 8px 12px 8px;
          font-size: 14px;
          box-sizing: border-box;
        }

        extended-fab {
          color: #eee;
          --svg-icon-color: #eee;
          border-radius: 10px;
          font-size: 14px;
          box-shadow: var(--shadow-elevation-3dp);
        }

        .flex {
          flex: 1;
        }

        nav-bar custom-tab.custom-selected {
          border: 2px solid #eee;
          font-size: 16px;
          border-radius: 18px;
          width: 72px;
        }

        nav-bar {
          background: #3f4354;
          border-radius: 24px;
        }

        .header {
          mixin(--css-row)

          justify-content: center;
          align-items: center;
          color: #EEE;
          height: 64px;
        }
      </style>

      <span class="column accounts">
        <wallet-accounts
          attr-for-selected="data-route"
          on-selected="accountSelected">
        </wallet-accounts>

        <extended-fab label="create wallet" icon="add"></extended-fab>
      </span>

      <span class="column">
        <span class="header"><h3>${'address'}</h3></span>
        <custom-pages class="wallet" attr-for-selected="data-route">

          <wallet-send data-route="send" class="hero"></wallet-send>
          <wallet-receive data-route="receive" class="hero"></wallet-receive>

          <wallet-transactions data-route="transactions" class="hero"></wallet-transactions>
        </custom-pages>

        <div class="wallet-navigation toolbar">
          <span class="flex"></span>
          <nav-bar
            items='["summary:summary", "send:send", "receive:receive", "transactions:transactions"]'
            attr-for-selected="data-route"
            on-selected="selectedChanged">
          </nav-bar>
          <span class="flex"></span>
        </div>
      </span>
    `;
  }
});

export default wallet;
