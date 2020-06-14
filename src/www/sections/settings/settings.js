import { define, RenderMixin, CSSMixin } from './../../shared-imports.js';

export default define(class SettingsSection extends RenderMixin(CSSMixin(HTMLElement)) {
  
  constructor() {
    super()
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
})