import { d as define, b as RenderMixin } from './chunk-30a2cd27.js';

define(class BusyAnimation extends RenderMixin(HTMLElement) {
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
        margin: 0 auto;
        background-color: #333;

        border-radius: 100%;
        -webkit-animation: scale 1.0s infinite ease-in-out;
        animation: scale 1.0s infinite ease-in-out;
      }

      @-webkit-keyframes scale {
        0% { -webkit-transform: scale(0) }
        100% {
          -webkit-transform: scale(1.0);
          opacity: 0;
        }
      }

      @keyframes scale {
        0% {
          -webkit-transform: scale(0);
          transform: scale(0);
        } 100% {
          -webkit-transform: scale(1.0);
          transform: scale(1.0);
          opacity: 0;
        }
      }
    </style>
    `
  }
});
