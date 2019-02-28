import define from '../../node_modules/backed/src/utils/define.js';
import merge from '../../node_modules/backed/src/utils/merge.js';
import PropertyMixin from '../../node_modules/backed/src/mixins/property-mixin'
import CSSMixin from '../../node_modules/backed/src/mixins/css-mixin';
import '../../node_modules/custom-tabs/src/custom-tab'
import CustomSelectorMixin from '../../node_modules/custom-select-mixins/src/selector-mixin.js'

export default define(class NavBar extends CSSMixin(PropertyMixin(CustomSelectorMixin(HTMLElement))) {
  static get properties() {
    return merge(super.properties, {
      items: {
        reflect: true,
        observer: 'itemsChanged'
      }
    })
  }

  constructor() {
    super()
    this.attachShadow({mode: 'open'})
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: row;
          align-items: flex-end;
          height: 46px;
          box-sizing: border-box;
        }
        ::slotted(custom-tab) {
          text-transform: uppercase;
          text-decoration: none;
          color: #eee;
          font-weight: 700;
          font-size: 14px;
          height: 46px;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 8px 24px;
          box-sizing: border-box;
          cursor: pointer;
          pointer-events: auto;
        }

        ::slotted(custom-tab.custom-selected) {
          background: #5557618a;
          box-sizing: border-box;
        }
      </style>
      <slot></slot>
    `
  }

  itemsChanged() {
    this.innerHTML = ''
    let items = JSON.parse(this.items);
    items = items.map(item => {
      item = item.split(':');
      return `
        <custom-tab data-route="${item[0]}" title="${item[0]}">
          ${item[1] ? `<custom-svg-icon style="pointer-events: none;" icon="${item[1]}"></custom-svg-icon>` : item[0]}
        </custom-tab>`
    })

    const elements = this.querySelectorAll('a');
    items.forEach((item, index) => {
      if (elements[index]) {
        elements[index] = item;
        return;
      }
      this.innerHTML += item
    })

  }
});
