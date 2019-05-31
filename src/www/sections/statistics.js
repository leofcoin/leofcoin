import { define, RenderMixin, CSSMixin } from './../shared-imports.js';
import './../extended-fab.js';

export default define(class StatisticsSection extends RenderMixin(HTMLElement) {

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
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
    </style>

    <h4>statistics</h4>
    <custom-svg-icon icon="device-hub"></custom-svg-icon><span class="peer-count">${'peerCount'}</span>
    `
  }
});
