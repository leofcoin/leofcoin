import { d as define, b as RenderMixin, c as CSSMixin } from './chunk-30a2cd27.js';

var explorerTransaction = define(class ExplorerTransaction extends RenderMixin(CSSMixin(HTMLElement)) {

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  connectedCallback() {
    super.connectedCallback();
  }

  set height(value) {
    this._height = value;
    this.setAttribute('height', value);
  }

  get height() {
    return this._height;
  }

  set block(value) {
    console.log({value});
    this.time = value.time;
    this.reward = value.reward;
    this.txCount = value.transactions.length;
    this.height = value.index;
    this.observer();
  }

  get block() {
    return this._block;
  }

  observer() {
    this.render({
      time: this.time,
      id: this.id,
      reward: this.reward,
      amount: this.amount
    });
  }

  set data(value) {
    (async () => {
      if (value.multihash) {
        value = await leofcoin.transaction.get(value.multihash);
      }
        console.log({value});
      this.time = value.time;
      this.id = value.id;
      this.reward = value.reward;
      this.amount = value.outputs.reduce((p, c) => p + c.amount, 0);
      this.observer();
    })();
  }


  get template() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: column;
        min-height: 48px;
        width: 100%;
        align-items: normal;
        pointer-events: auto;
        cursor: pointer;
        padding: 12px;
        box-sizing: border-box;
      }
      span {
        pointer-events: none;
      }
      apply(--css-flex)
      apply(--css-row)

    </style>

    <span>${'id'}</span>
    <span class="flex"></span>
    <span>${'age'}</span>
    <span class="flex"></span>
    <span class="row">
    <h4>
      reward:
      <span> ${'reward'}</span>
    </h4>

    <span class="flex"></span>
    <h4>
      amount:
      <span> ${'amount'}</span>
    </h4>
    </span>

    `;
  }

});

export default explorerTransaction;
