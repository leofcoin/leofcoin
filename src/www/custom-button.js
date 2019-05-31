import define from './../../node_modules/backed/src/utils/define';

export default define(class CustomButton extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({mode: 'open'});

    this.shadowRoot.innerHTML = `
    <style>
      :host {
        --custom-button-height: 40px;
        display: block;
        width: 124px;
        height: var(--custom-button-height);
        pointer-events: auto;
        cursor: pointer;
        border-radius: calc(var(--custom-button-height) / 3);
      }

      button {
        pointer-events: show;
        display: block;
        width: 124px;
        height: var(--custom-button-height);
        border: none;
        border-radius: calc(var(--custom-button-height) / 3);
        user-select: none;
        outline: none;
        text-transform: uppercase;
        background: transparent;
        color: #ddd;
        cursor: pointer;
      }

      button:hover {
        box-shadow: var(--shadow-elevation-3dp);
        transition: box-shadow 16ms ease-in;
        background: #3f435452;
        /* color: #333; */
      }

      button:active {
        box-shadow: var(--shadow-elevation-0dp);
        transition: box-shadow 96ms ease-out;
        background: transparent;
        /* color: #ddd; */
      }
    </style>
    <button><slot></slot></button>
    `
  }
})
