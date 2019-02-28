import { define, RenderMixin } from './../shared-imports.js';

export default define(class SyncingAnimation extends RenderMixin(HTMLElement) {
  constructor() {
    super()
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
})
