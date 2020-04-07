import { define, RenderMixin, CSSMixin } from './../shared-imports.js';
import './../extended-fab.js';

export default define(class StatisticsSection extends RenderMixin(HTMLElement) {

  set peerCount(value) {
    this._peerCount = value
    this.render({peerCount: value})
  }
  
  get peerCount() {
    return this._peerCount
  }
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }
  
  connectedCallback()  {
    if (super.connectedCallback) super.connectedCallback();
    
    bus.on('peer:connect', rpc.handle(peers => {
      console.log(peers);
    }));
    
    bus.on('peer:discover', rpc.handle(discover => {
      console.log({discover});
    }));
    (async () => {
      const _peers = await peers()
      this.peerCount = _peers.length
    })();
    setInterval(async () => {
      const _peers = await peers()
      this.peerCount = _peers.length
    }, 60000);
  }

  get template() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
      }
      
      .row {
        display: flex;
      }
    </style>

    <h4>statistics</h4>
    <span class="row">
      <custom-svg-icon icon="device-hub"></custom-svg-icon>
      <h5>peers</h5>
      <span class="peer-count">${'peerCount'}</span>
    </span>
    `
  }
});
