import { define, merge, RenderMixin, PropertyMixin } from './shared-imports.js';
import './animations/syncing.js';
import './animations/busy.js';
import './extended-fab.js';

export default define(class SplashScreen extends RenderMixin(HTMLElement) {
  set ready(value) {
    if (value) {
      this.innerHTML = '<strong>Hi!<strong>'
      setTimeout(() => {
        requestAnimationFrame(() => {
          this.setAttribute('ready', value);
        });
      }, 800);
    }
  }
  set connecting(value) {
    if (value) this.render({
      title: 'connecting peers',
      splash: this.connectingAnimation
    })

    this._connecting = value;
  }
  set syncing(value) {
    if (value) this.render({
      title: 'syncing chain',
      splash: this.syncingAnimation
    })

    this.setAttribute('syncing', value);
  }
  get fab() { return this.shadowRoot.querySelector('extended-fab') }
  get syncing() { return this.getAttribute('syncing') }
  get connecting() { return this._connecting }
  get ready() { return this.getAttribute('ready') }

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.hide = this.hide.bind(this);
  }
  connectedCallback() {
    super.connectedCallback();
    this.fab.addEventListener('click', this.hide);
    this.ready = false;
    (async () => {
      this.render({
        title: 'loading',
        splash: this.connectingAnimation
      })
      this.ready = await leofcoin.api.state('ready')
      if (this.ready) return;
      this.ready = await leofcoin.api.state('ready', true);
    })()
  }
  get connectingAnimation() {
    return `
      <busy-animation></busy-animation>
    `;
  }
  get syncingAnimation() {
    return `
    <syncing-animation></syncing-animation>
    `;
  }
  hide() {
    this.ready = true;
    document.removeChild(this);
  }
  get template() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          position: absolute;
          background: #FFF;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          user-select: none;
          outline: none;
        }
        :host([ready]) {
          opacity: 0;
          pointer-events: none;
          z-index: 0;
        }
        extended-fab {
          position: absolute;
          bottom: 48px;
          left: 50%;
          transform: translate(-50%, 110%);
          opacity: 0;
        }

        :host([syncing]) extended-fab {
          opacity: 1;
          transform: translate(-50%, 0);
          transition: opacity 160ms ease-in, transform 160ms ease-in;
        }

        strong {
          padding-top: 24px;
        }
      </style>
      <slot>
        <span>${'splash'}</span>
        <strong>${'title'}</strong>
        <extended-fab label="hide" icon="close"></extended-fab>
      </slot>
    `;
  }
})
