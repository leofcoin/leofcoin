import { define, RenderMixin, CSSMixin } from './../../shared-imports.js';

export default define(class MinerHashrate extends RenderMixin(CSSMixin(HTMLElement)) {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  updateRate(uid, rate) {
    console.log(uid);
    let hashEl = this.querySelector(`[data-uid="${uid}"]`);
    if (!hashEl) {
      hashEl = document.createElement('span');
      hashEl.dataset.uid = uid;
      this.appendChild(hashEl);
    }
    hashEl.innerHTML = `${rate} kH/s`;
    hashEl.dataset.rate = rate;
    const nodes = this.shadowRoot.querySelector('slot').assignedElements();
    const hashrate = nodes.reduce((p, c) => p + Number(c.dataset.rate), 0);
    this.render({ hashrate: `${Math.round(hashrate * 100) / 100} kH/s`, intensity: nodes.length })
  }

  get template() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          min-width: 200px;
        }
        apply(--css-column)
        apply(--css-row)
        apply(--css-flex)
        .dropdown {
          display: none;
        }
      </style>
      <span class="row">
        <span>${'hashrate'}</span>
        <span class="flex"></span>
        <span title="intensity (cpu cores)">${'intensity'}</span>
      </span>
      <span class="dropdown column">
        <slot></slot>
      </span>
    `;
  }
})
