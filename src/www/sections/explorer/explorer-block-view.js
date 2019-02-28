import { define, RenderMixin, PropertyMixin, merge } from './../../shared-imports.js';

export default define(class ExplorerBlockView extends RenderMixin(PropertyMixin(HTMLElement)) {
  static get properties() {
    return merge(super.properties, {
      index: {
        // observer: 'ob'
        value: '__'
      },
      prevHash: {
        // observer: 'ob'
        value: '__'
      },
      hash: {
        // observer: 'ob'
        value: '__'
      },
      time: {
        // observer: 'ob'
        value: '__'
      },
      transactionVolume: {
        // observer: 'ob'
        value: '__'
      },
      outputAmount: {
        // observer: 'ob'
        value: '__'
      },
      nextHash: {
        // observer: 'ob'
        value: '__'
      },
      difficulty: {
        // observer: 'ob'
        value: '__'
      },
      date: {
        value: ''
      },
      blockReward: {
        value: 0
      },
      transactionLength: {
        value: 0
      },
      transactionsString: {
        value: ''
      },
      blockSize: {
        value: 0
      }
    })
  }
  constructor() {
    super();
    this.attachShadow({mode: 'open'})
    this.onHashClick = this.onHashClick.bind(this)
  }

  connectedCallback() {
    super.connectedCallback();
  }

  async onHashClick(event) {
    const data = await block(event.path[0].innerHTML)
    document.dispatchEvent(new CustomEvent(`show-block`, { detail: data }));
  }
  /**
   * @param {object} block {index, prevHash, hash, transactions, time}
   */
  stamp(block, next) {
    Object.keys(block).forEach(property => {
      this[property] = block[property]
    });
    if (next) this.nextHash = next.hash;
    else {
      // TODO: improve timeTillNextBlock
      let timeTillNextBlock = 10;
      setInterval(() => {
        timeTillNextBlock--;

        this.nextHash = `approximate time till next block ${timeTillNextBlock}s`;
      }, 1000);
    }
    this.date = new Date(this.time * 1000).toString()
    this.inputs = this.transactions.reduce((inputs, tx) => inputs.concat(tx.inputs), []);

  	// Find all outputs with their tx ids
  	this.outputs = this.transactions.reduce((outputs, tx) =>
  		outputs.concat(tx.outputs.map(output => Object.assign({}, output, {tx: tx.id}))), []);

  	// Figure out which outputs are unspent
  	this.unspent = this.outputs.filter(output =>
  		typeof this.inputs.find(input => input.tx === output.tx && input.index === output.index && input.amount === output.amount) === 'undefined');

    this.outputAmount = this.outputs.reduce((amount, o) => amount + o.amount, 0);
    this.transactionVolume = String(this.outputAmount - this.unspent.reduce((amount, o) => Number(amount) + o.amount, 0));

    const getDifficulty = hash => {
    	return parseInt(hash.substring(0, 8), 16);
    };
    this.difficulty = getDifficulty(block.hash)

    this.blockReward = this.transactions.reduce((p, tx) => {
      if (tx.reward) return tx.outputs[0].amount;
      else return p;
    }, 0)

    const o = {};
    this.blockSize = block.size;
    this.transactionLength = `<strong>transactions</strong><span class="flex"></span>${this.transactions.length}`;
    // this.transactions.reduce((p, c) => {}, initial)
    this.transactionsString = this.transactions.map(tx => {
      // console.log(tx.inputs);
      const un = tx.inputs.reduce((p, c) => {
        if (p[c.address]) {
          p[c.address].amount += c.amount;
        } else p[c.address] = c;
        return p;
      }, {})
      tx.inputs = Object.values(un)
      tx.inputs = [...(new Set(tx.inputs))]
      if (tx.reward) return `

        <span class="ti vertical">
          <span class="row">
            <strong>ID</strong>
            <span class="flex"></span>
            <span class="id">${tx.id}</span>
          </span>
          <span class="row">
            No Inputs(new mined coins)
            <span class="flex-3"></span>
            &#x21E8;
            <span class="flex-3"></span>
            <a>${tx.outputs[0].address}</a>
            <span class="flex"></span>
            <p><strong>${tx.outputs[0].amount}</strong> LFC</p>
          </span>
        </span>`;

      else return `
      <span class="ti vertical">
        <span class="row">
          <strong>ID</strong>
          <span class="flex"></span>
          <span class="id">${tx.id}</span>
        </span>
        <span class="row">
        <span class="column">
        ${tx.inputs.map(i => `
          <a>${i.address}</a>
        `).join(' ')}
        </span>
        <span class="flex-3"></span>
        &#x21E8;
        <span class="flex-3"></span>
          <span class="vertical">
          ${tx.outputs.map(o => `
            <span class="row">
              <a>${o.address}</a>
              <span class="flex"></span>
              <p><strong>${o.amount}</strong> LFC</p>
            </span>
          `).join(' ')}
          </span>
        </span>
      </span>
      `
    }).join(' ');
    Object.keys(this.properties).forEach(k => o[k] = this[k] || '')
    this.render(o);

    if (!this.links) {
      const links = this.shadowRoot.querySelectorAll('.link');
      for (var i = 0; i < links.length; i++) {
        links[i].onclick = this.onHashClick
      }
      this.links = links;
    }
  }
  get template() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-y: auto;
          /* color: #555; */
          cursor: default;
          background: #fff;
          position: relative;
          padding-top: 24px;
        }
        summary {
          line-height: 24px;
          font-family: 'ROBOTO-LIGHT', sans-serif;
          font-size: 15px;
          text-rendering: optimizeLegibility;
          box-shadow: var(--shadow-elevation-2dp);
          margin-bottom: 24px;
          width: 840px;
        }
        .flex {
          flex: 1;
        }
        .flex-2 {
          flex: 2;
        }
        .flex-3 {
          flex: 3;
        }
        .ti {
          display: flex;
          padding: 8px 16px;
          box-sizing: border-box;
        }
        summary .ti:nth-of-type(odd) {
          background: #eee;
        }
        h4, h3, p {
          margin: 0;
        }
        h3, h4 {
          padding: 8px 16px 12px 16px;
          width: 840px;
          box-sizing: border-box;
        }
        ::slotted(header) {
          height: 32px;
        }
        .row, .vertical {
          display: flex;
        }
        .vertical {
          flex-direction: column;
        }
        .row {
          flex-direction: row;
        }
        .spacing {
          display: flex;
          padding: 0 2px;
        }
        a {
          display: flex;
          padding-right: 18px;
        }
        .link {
          padding: 0;
          pointer-events: auto;
          cursor: pointer;
        }
      </style>
      <slot name="toolbar"></slot>
      <h3>block #<span>${'index'}</span></h3>

      <summary class="info">
        <p class="ti"><strong>time</strong><span class="flex"></span><span>${'date'}</span></p>
        <p class="ti">${'transactionLength'}</p>
        <p class="ti"><strong>transaction output</strong><span class="flex"></span><span>${'outputAmount'}</span><span class="spacing"></span> LFC</p>
        <p class="ti"><strong>transaction output volume</strong><span class="flex"></span><span>${'transactionVolume'}</span><span class="spacing"></span> LFC</p>
        <p class="ti"><strong>Fees</strong><span class="flex"></span>0 LFC</p>
        <p class="ti"><strong>difficulty</strong><span class="flex"></span><span>${'difficulty'}</span></p>
        <p class="ti"><strong>block size</strong><span class="flex"></span><span>${'blockSize'}</span><span class="spacing"></span> bytes</p>
        <p class="ti"><strong>block reward</strong><span class="flex"></span><span>${'blockReward'}</span><span class="spacing"></span> LFC</p>
      </summary>

      <h4>hashes</h4>
      <summary class="hashes">
        <p class="ti"><strong>hash</strong><span class="flex"></span><span>${'hash'}</span></p>
        <p class="ti"><strong>previous</strong><span class="flex"></span><a class="link">${'prevHash'}</a></p>
        <p class="ti"><strong>next</strong><span class="flex"></span><a class="link">${'nextHash'}</a></p>
      </summary>

      <h4>transactions</h4>
      <summary class="transactions">
        ${'transactionsString'}
      </summary>
    `;
  }
});
