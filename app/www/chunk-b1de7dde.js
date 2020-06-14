import { d as define, b as RenderMixin, e as merge, f as PropertyMixin, c as CSSMixin, g as SelectorMixin } from './chunk-30a2cd27.js';

define(class CustomTab extends RenderMixin(HTMLElement) {
  constructor() {
    super();
    this._onMouseIn = this._onMouseIn.bind(this);
    this._onMouseOut = this._onMouseOut.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('mouseover', this._onMouseIn);
    this.addEventListener('mouseout', this._onMouseOut);
  }

  disconnected() {
    this.removeEventListener('mouseover', this._onMouseIn);
    this.removeEventListener('mouseout', this._onMouseOut);
  }

  _onMouseIn() {
    this.classList.add('over');
  }

  _onMouseOut() {
    this.classList.remove('over');
  }

  get template() {
    return html`
    <style>
      :host {
        position: relative;
        display: inline-flex;
        width: 148px;
        height: 48px;
        align-items: center;
        justify-content: center;
        padding: 8px 12px;
        box-sizing: border-box;
        cursor: pointer;

        --svg-icon-size: 16px;
        --svg-icon-color: #EEE;
      }

      :host(.custom-selected) {
        border-bottom: 2px solid #00B8D4;
      }
    </style>
    <slot></slot>
    `;
  }
});

define(class NavBar extends CSSMixin(PropertyMixin(SelectorMixin(HTMLElement))) {
  static get properties() {
    return merge(super.properties, {
      items: {
        reflect: true,
        observer: 'itemsChanged'
      }
    })
  }

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
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
    `;
  }

  itemsChanged() {
    this.innerHTML = '';
    let items = JSON.parse(this.items);
    items = items.map(item => {
      item = item.split(':');
      return `
        <custom-tab data-route="${item[0]}" title="${item[0]}">
          ${item[1] ? `<custom-svg-icon style="pointer-events: none;" icon="${item[1]}"></custom-svg-icon>` : item[0]}
        </custom-tab>`
    });

    const elements = this.querySelectorAll('a');
    items.forEach((item, index) => {
      if (elements[index]) {
        elements[index] = item;
        return;
      }
      this.innerHTML += item;
    });

  }
});
