import { d as define, b as RenderMixin, c as CSSMixin } from './chunk-30a2cd27.js';

var explorerBlock = define(class ExplorerBlock extends RenderMixin(CSSMixin(HTMLElement)) {

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  connectedCallback() {
    super.connectedCallback();
  }

  set age(value) {
    let hours;
    let minutes;
    let seconds;
    let string = '<custom-svg-icon icon="clock"></custom-svg-icon>';
    const current = new Date().getTime();
    const age = ((current / 1000) - value) / 86400; // 24 hours
    let days = String(age).split('.');
    if (days && days[1]) {
      hours = String(Number(`0.${days[1]}`) * 24).split('.');
      days = days[0];
    }
    if (hours && hours[1]) {
      minutes = String(Number(`0.${hours[1]}`) * 60).split('.');
      hours = hours[0];
    }
    if (minutes && minutes[1]) {
      seconds = String(Number(`0.${minutes[1]}`) * 60).split('.');
      minutes = minutes[0];
      if (seconds[1]) seconds = seconds[0];
    }
    if (Number(days) > 0) string += `<span class="time">${days}</span><strong>days</strong>`;
    if (Number(days) > 0 && Number(hours) > 0) string += `<span class="time">${hours}</span><strong>hours</strong>`;
    console.log(days, hours, minutes, seconds);
    // if (Number(hours) === 0 && Number(days) === 0) {
      if (Number(minutes) > 0) string += `<span class="time">${minutes}</span><strong>minutes</strong>`;
      if (Number(seconds) > 0) string += `<span class="time">${seconds}</span><strong>seconds</strong>`;
    // };
    string += '<span class="time">ago</span>';
    console.log(string);
    this._age = string;
  }

  get age() {
    return this._age;
  }

  set height(value) {
    this._height = value;
    this.setAttribute('height', value);
  }

  get height() {
    return this._height;
  }

  set data(value) {
    console.log(value);
    this.time = value.time;
    this.age = value.time;
    this.txCount = value.transactions.length;
    this.height = value.index;

    let amount = 0;

    value.transactions.forEach(async tx => {
      console.log(tx);
      if (tx.multihash) {
        tx = await leofcoin.transaction.get(tx.multihash);
        console.log(tx);
      }
      tx.outputs.forEach(o => amount += o.amount);
      tx.inputs.forEach(i => amount += i.amount);
      if (tx.reward) this.address = tx.outputs[0].address;
      this.observer();
    });
    this.amount = amount;
    this._data = value;
    this.observer();
  }

  get data() {
    return this._data;
  }

  observer() {
    console.log(this.age, this.txCount, this.height, this.address);
    if (this.age && this.txCount && this.height && this.address) {
      this.render({
        txCount: this.txCount,
        height: this.height,
        age: this.age,
        address: this.address,
        amount: this.amount
      });
    }
  }


  get template() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: column;
        margin: 0 0 12px;
        min-height: 100px;
        height: 100px;
        padding: 0 0 6px 0;
        width: 100%;
        align-items: normal;
        pointer-events: auto;
        cursor: pointer;
        box-sizing: border-box;
        border: 1px solid #5e6375;
        border-radius: 12px;
        --svg-icon-size: 20px;
      }
      h4 {
        margin: 0;
      }
      span {
        pointer-events: none;
      }
      apply(--css-flex)
      apply(--css-flex-2)
      apply(--css-column)
      apply(--css-row)

      .column {
        min-height: 42px;
        align-items: center;
        justify-content: space-around;
      }
      .row {
        width: 100%;
      }
      .row.one {
        background: #5e6375;
        border-radius: 10px;
        align-items: center;
        padding: 7px;
        box-sizing: border-box;
      }
      .two {
        padding-left: 24px;
      }
      .two h4 {
        width: 100%;
      }
      .time {
        padding: 0 4px;
        box-sizing: border-box;
      }
      .age {
        display: flex;
        align-items: center;
      }
    </style>

    <span class="row one">
      <h4>
        block
        <span>${'height'}</span>
      </h4>
      <span class="flex"></span>
      <span class="age">${'age'}</span>
    </span>
    <span class="flex"></span>
    <span class="column two">
      <h4>
        by:
        <span>${'address'}</span>
      </h4>

      <span class="flex-2"></span>

      <span class="row">
        <h4>
          amount:
          <span>${'amount'}</span>
        </h4>

        <span class="flex"></span>

        <h4>
          transactions:
          <span>${'txCount'}</span>
        </h4>
      </span>
    </span>
    `;
  }

});

export default explorerBlock;
