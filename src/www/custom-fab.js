import define from '../../node_modules/backed/src/utils/define.js';
import merge from '../../node_modules/backed/src/utils/merge.js';
import PropertyMixin from '../../node_modules/backed/src/mixins/property-mixin';
import '../../node_modules/custom-button/custom-button.js';

export default define(class CustomFab extends PropertyMixin(HTMLElement) {
  static get properties() {
    return merge(super.properties, {})
  }
  constructor() {
    super()
    this.attachShadow({mode: 'open'})
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
    super.connectedCallback()
    this.addEventListener('mousedown', event => {
      this.classList.add('pressed');
    });
    this.addEventListener('mouseup', event => {
      this.classList.remove('pressed');
    });
  }
})
