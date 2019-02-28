import define from '../../node_modules/backed/src/utils/define.js';
import merge from '../../node_modules/backed/src/utils/merge.js';
import PropertyMixin from '../../node_modules/backed/src/mixins/property-mixin';
import RenderMixin from '../../node_modules/custom-renderer-mixin/src/render-mixin';
import '../../node_modules/custom-svg-icon/src/custom-svg-icon';
/**
 * @example
 ```html
  <custom-copy>TEXT TO COPY</custom-copy>
  <custom-copy value="TEXT TO COPY"></custom-copy>
 ```
 *
 */
export default define(class CustomCopy extends PropertyMixin(HTMLElement) {
  static get properties() {
    return {
      value: {
        reflect: true
      }
    }
  }

  constructor() {
    super();
    this.mousedown = this.mousedown.bind(this);
    this.mouseup = this.mouseup.bind(this);
    this.addEventListener('mousedown', this.mousedown);
    this.addEventListener('mousedown', this.mouseup);
    this.attachShadow({mode: 'open'})
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          align-items: baseline;
          pointer-events: auto;
          cursor: pointer;
          user-select: auto;
        }
        .copy-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          padding: 4px;
          margin-left: 8px;
          box-sizing: border-box;
          pointer-events: auto;
          cursor: pointer;
          box-shadow: var(--shadow-elevation-4dp);
          border-radius: 2px;
          user-select: none;
          --custom-svg-icon-size: 22px;
        }
        .copy-button.down {
          box-shadow: none;
        }
        custom-svg-icon {
          pointer-events: none;
        }
      </style>
      <slot></slot>
      <span class="copy-button">
        <custom-svg-icon icon="copy"></custom-svg-icon>
      </span>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  mouseup() {
    this.shadowRoot.querySelector('.copy-button').classList.remove('down');

    if (this.range) {
      setTimeout(() => {
        if ('removeRange' in window.getSelection())
          window.getSelection().removeRange(this.range);
        else
          window.getSelection().removeAllRanges();


        this.range = null;
        this.style.userSelect = 'none';
      }, 60);
    }
  }
  // if (process) {
  //   document.dispatchEvent(new CustomEvent('custom-copy', {
  //     detail: this.value || this.innerHTML
  //   }))
  // } else {
  mousedown() {
    this.shadowRoot.querySelector('.copy-button').classList.add('down');
    this.style.userSelect = 'auto';
    // TODO: show tooltip when copied
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.value || this.innerHTML)
      .then(() => {
        console.log('Text copied to clipboard');
      })
      .catch(err => {
        // This can happen if the user denies clipboard permissions:
        console.error('Could not copy text: ', err);
      });
    } else {
      // do it the old way
      const nodes = this.shadowRoot.querySelector('slot').assignedNodes();
      const node = nodes[0];
      if (!node) return alert('Nothing to copy')
      const selection = window.getSelection();
      this.range = document.createRange();
      this.range.selectNodeContents(node);
      selection.removeAllRanges();
      selection.addRange(this.range);
      try {
        // Now that we've selected the anchor text, execute the copy command
        const successful = document.execCommand('copy');
        const msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copy was ' + msg);
      } catch(err) {
        console.log('Oops, unable to copy');
      }
      // document.body.removeChild(span);
      // Remove the selections - NOTE: Should use
      // removeRange(range) when it is supported
    }


  }
})
