import { d as define, b as RenderMixin, c as CSSMixin } from './chunk-30a2cd27.js';

var settings = define(class SettingsSection extends RenderMixin(CSSMixin(HTMLElement)) {
  
  constructor() {
    super();
    this.attachShadow({mode: 'open'});

    this._onClick = this._onClick.bind(this);
  }
  
  connectedCallback() {
    super.connectedCallback();
  }
  
  get template() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: column;
      }
    </style>
    <h3>Settings</h3>
    
    <input type="checkbox"></input> mine when idle
    `
  }
  
  _onClick() {
    
  }
});

export default settings;
