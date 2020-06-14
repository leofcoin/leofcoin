import './chunk-87e8379e.js';
import './chunk-b455c5f0.js';
import { d as define, b as RenderMixin, e as merge, f as PropertyMixin } from './chunk-30a2cd27.js';

define(class SyncingAnimation extends RenderMixin(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  get template() {
    return html`
    <style>
      :host {
        display: block;
        width: 40px;
        height: 40px;
      }
      .block {
        width: 33%;
        height: 33%;
        background-color: #333;
        float: left;
        -webkit-animation: gridScaleDelay 1.3s infinite ease-in-out;
                animation: gridScaleDelay 1.3s infinite ease-in-out;
      }
      .block1 {
        -webkit-animation-delay: 0.2s;
                animation-delay: 0.2s; }
      .block2 {
        -webkit-animation-delay: 0.3s;
                animation-delay: 0.3s; }
      .block3 {
        -webkit-animation-delay: 0.4s;
                animation-delay: 0.4s; }
      .block4 {
        -webkit-animation-delay: 0.1s;
                animation-delay: 0.1s; }
      .block5 {
        -webkit-animation-delay: 0.2s;
                animation-delay: 0.2s; }
      .block6 {
        -webkit-animation-delay: 0.3s;
                animation-delay: 0.3s; }
      .block7 {
        -webkit-animation-delay: 0s;
                animation-delay: 0s; }
      .block8 {
        -webkit-animation-delay: 0.1s;
                animation-delay: 0.1s; }
      .block9 {
        -webkit-animation-delay: 0.2s;
                animation-delay: 0.2s; }
      @-webkit-keyframes gridScaleDelay {
        0%, 70%, 100% {
          -webkit-transform: scale3D(1, 1, 1);
                  transform: scale3D(1, 1, 1);
        } 35% {
          -webkit-transform: scale3D(0, 0, 1);
                  transform: scale3D(0, 0, 1);
                  opacity: 0;
        }
      }
      @keyframes gridScaleDelay {
        0%, 70%, 100% {
          -webkit-transform: scale3D(1, 1, 1);
                  transform: scale3D(1, 1, 1);
        } 35% {
          -webkit-transform: scale3D(0, 0, 1);
                  transform: scale3D(0, 0, 1);
                  opacity: 0;
        }
      }
    </style>
    <div class="block block1"></div>
    <div class="block block2"></div>
    <div class="block block3"></div>
    <div class="block block4"></div>
    <div class="block block5"></div>
    <div class="block block6"></div>
    <div class="block block7"></div>
    <div class="block block8"></div>
    <div class="block block9"></div>
    `
  }
});

var splashScreen = define(class SplashScreen extends RenderMixin(HTMLElement) {
  set ready(value) {
    if (value) {
      this.innerHTML = '<strong>Hi!<strong>';
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
    });

    this._connecting = value;
  }
  set syncing(value) {
    if (value) this.render({
      title: 'syncing chain',
      splash: this.syncingAnimation
    });

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
      });
      this.ready = await leofcoin.api.state('ready');
      if (this.ready) return;
      this.ready = await leofcoin.api.state('ready', true);
    })();
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
});

export default splashScreen;
