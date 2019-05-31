import { define, RenderMixin, CSSMixin } from './../../shared-imports.js';
import './miner-hashrate.js';
import './../../extended-fab.js';

export default define(class MinerSection extends RenderMixin(HTMLElement) {

  get hashrate () {
    return this.shadowRoot.querySelector('miner-hashrate');
  }
  get address () {
    return this.shadowRoot.querySelector('.address');
  }
  get intensity () {
    return this.shadowRoot.querySelector('.intensity');
  }
  get afterIntensity () {
    if (!this._afterIntensity) this._afterIntensity = this.intensity.parentNode.insertBefore(document.createElement('span'), this.intensity)
    return this._afterIntensity;
  }
  get mineButton () {
    return this.shadowRoot.querySelector('.mine-button');
  }

  get hasHashrateElement() {
    return this.hashrate.childElementCount === 1;
  }

  set mining(value) {
    if (this._mining !== value) {
      this._mining = value;
      this.setAttribute('mining', value);
      this.observer();
    }
  }

  get mining() {
    return this._mining || false;
  }

  constructor() {
    super()
    this.attachShadow({mode: 'open'});

    this.hashrateChange = this.hashrateChange.bind(this);
    this.jobCancelled = this.jobCancelled.bind(this);
    this.mine = this.mine.bind(this);
// rpc.handle(data => termUI.write(data)))
    window.bus.on('miner.hashrate', rpc.handle(this.hashrateChange));
    window.bus.on('miner.job.cancel', rpc.handle(this.jobCancelled));
    window.bus.on('miner.mining', rpc.handle(this._onMining));
  }

  _onMining(value) {
    this.mining = value;
  }

  connectedCallback() {
    super.connectedCallback();
    (async () => {
      this.cores = await cores();
      this.config = await getMinerConfig();
      this.mining = await state('mining');
      this.address.value = this.config.address;
      this.intensity.value = this.config.intensity;
      this.intensity.max = this.cores;
      // this.afterIntensity.innerHTML = this.config.intensity;
      // TODO: add max intensity so we dont mine duplicate blocks
      this.intensity.addEventListener('change', async event => {
        this.config.intensity = this.intensity.value;
        // this.afterIntensity.innerHTML = this.intensity.value;
        await setMinerConfig(this.config)
        if (this.hasAttribute('mining')) mine(this.config);
      });

      this.address.addEventListener('change', async event => {
        this.config.address = this.address.value;
        await setMinerConfig(this.config)
        if (this.hasAttribute('mining')) mine(this.config);
      });

      this.mineButton.addEventListener('click', this.mine);
    })()
    // document.addEventListener('hashrate', hashrateChange);
    // document.addEventListener('job-cancelled', jobCancelled);
  }

  newHashrateElement(uid) {
    const el = document.createElement('span')
    el.setAttribute('uid', uid);
    this.hashrate.appendChild(el);
    return el;
  }

  hashrateChange({hashrate, uid}) {
    // let hashEl;
    // if (this.hasHashrateElement) {
    //   hashEl = this.shadowRoot.querySelector(`[uid="${uid}"]`);
    //   if (!hashEl) {
    //     hashEl = this.hasHashrate.firstChild();
    //     hashrate = hashrate + Number(hashEl.innerHTML.replace(' kH/s', ''));
    //   }
    // } else {
    //   hashEl = this.newHashrateElement(uid)
    // }
    // hashEl.innerHTML = `${hashrate} kH/s`;
    this.hashrate.updateRate(uid, hashrate)
    // totalHashrate.innerHTML = this.hasHashrate.children.reduce((p, c) => {}, 0)
  }

  jobCancelled(uid) {
    const el = this.shadowRoot.querySelector(`[uid="${uid}"]`)
    if (el) this.hashrate.removeChild(el);
  }

  observer() {
    if (this.mining) {
      this.mineButton.icon = 'stop';
      this.mineButton.label = 'Stop Mining';
      this.mineButton.style.background = '#ffa7a7';
      this.setAttribute('mining', '');
    } else {
      this.mineButton.icon = 'play';
      this.mineButton.label = 'Start Mining';
      this.mineButton.style.background = 'transparent';
      this.removeAttribute('mining');
    }
  }

  mine() {
    mine(this.config);
    this.mining = !this.mining;
  }

  get template() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: column !important;
        height: 100% !important;
        width: 100%;
        align-items: normal;
        pointer-events: none;
      }
      .miner-controls {
        padding: 2em;
        box-sizing: border-box;
        position: relative;
        pointer-events: auto;
      }
      .start-button, .stop-button {
        position: absolute;
      }
      .flex {
        flex: 1;
      }
      .row {
        display: flex;
        flex-direction: row;
      }
      .vertical {
        display: flex;
        flex-direction: column;
      }
      .vertical-layout {
        height: 100%;
        width: 100%;
      }
      .center {
        align-items: center;
      }
      input {
        background: none;
        color: inherit;
        border: none;
        outline: none;
        width: 320px;
        text-align: center;
        pointer-events: auto;
        cursor: pointer;
      }
      .text-align {
        text-align: center;
      }
    </style>

    <span class="vertical text-align">
      <h3>Current Mining Address</h3>
      <input class="address"></input>
      <span class="flex"></span>
    </span>

    <span class="vertical vertical-layout center">
      <span class="flex"></span>
      <h3 title="Amount off cpu cores">Intensity</h3>
      <input class="intensity" type="range" max="8" min="1" step="1"></input>
      <miner-hashrate></miner-hashrate>
      <span class="flex"></span>
      <span class="miner-controls vertical center">
        <extended-fab class="mine-button"></extended-fab>
      </span>
    </span>
    `;
  }

});
