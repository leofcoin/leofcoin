import { define, RenderMixin, CSSMixin, SelectorMixin } from './../../shared-imports.js';
import './../../extended-fab.js';

export default define(class ExplorerListView extends RenderMixin(SelectorMixin(HTMLElement)) {

  get last() {
    return this.getAttribute('last');
  }

  set last(value) {
    this.setAttribute('last', value);
  }

  get type() {
    return this.getAttribute('type')
  }

  set type(value) {
    this.setAttribute('type', value);
  }
  constructor() {
    super()
    this.attachShadow({mode: 'open'});

    this._onBlockAdded = this._onBlockAdded.bind(this);
    bus.on('block.added', this._onBlockAdded);
  }

  connectedCallback() {
    super.connectedCallback();
    this.attrForSelected = 'height';
    if (!this.type) this.type = 'block';
    (async () => {
      await import(`./explorer-${this.type}.js`);

      if (this.type === 'block') this.items = await leofcoin.api.blocks(Number(this.last), true);
      if (this.type === 'transaction') this.items = await leofcoin.api.transactions(Number(this.last), true);
      console.log(this.items);
      
      for (var i = 0; i < this.items.length; i++) {
        const el = document.createElement(`explorer-${this.type}`);
        this.appendChild(el);
        el.data = this.items[i];
      }
    })()
    // document.addEventListener('hashrate', hashrateChange);
    // document.addEventListener('job-cancelled', jobCancelled);
  }

  async _onBlockAdded() {
    this.innerHTML = ''
    if (this.type === 'block') this.items = await leofcoin.api.blocks(Number(this.last), true);
    if (this.type === 'transaction') this.items = await leofcoin.api.transactions(Number(this.last), true);
    console.log(this.items);

    for (var i = 0; i < this.items.length; i++) {
      const el = document.createElement(`explorer-${this.type}`);
      this.appendChild(el);
      el.data = this.items[i];
    }
  }

  _updateSelected() {
    const selected = this.querySelector(`[height='${this.selected}']`);
    super._updateSelected(selected);
    console.log(selected.data);
    document.dispatchEvent(new CustomEvent(`show-${this.type}`, { detail: selected.data }))
  }


  get template() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        align-items: normal;
        pointer-events: auto;
        overflow-y: auto;
        padding: 10px 10px 0 10px;
      }

      apply(--css-row)

    </style>

    <span class="row">
    </span>

    <slot></slot>
    `;
  }

});
