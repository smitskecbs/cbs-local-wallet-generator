(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=``+new URL(`banner-VlvMnCdA.png`,import.meta.url).href,t=document.querySelector(`#app`);if(!t)throw Error(`App element not found`);var n=!1,r=0,i=[],a=0,o=0,s=[`0`,`O`,`I`,`l`],c=`cbs-recent-wallets`;t.innerHTML=`
  <div class="container">
    <div class="hero">
      <img src="${e}" alt="CBS Wallet Generator Banner" />
    </div>

    <div class="card">
      <div class="import-box">
        <strong>Safety notice</strong><br><br>
        This tool generates Solana wallets locally in your browser.<br>
        No backend. No cloud key storage. Private keys stay on your device.<br><br>
        Always back up your private key offline. Never share your private key.
      </div>

      <br>

      <label>Match position</label>
      <select id="position">
        <option value="prefix">Start of wallet</option>
        <option value="suffix">End of wallet</option>
        <option value="both">Start OR end of wallet</option>
        <option value="bothEnds">Start AND end of wallet</option>
      </select>

      <div id="patternFields"></div>

      <div class="checkbox-row">
        <input id="ignoreCase" type="checkbox" />
        <label for="ignoreCase">Ignore letter casing</label>
      </div>

      <p>Invalid characters: 0 O I l</p>

      <div id="estimateBox" class="import-box">
        Enter a pattern to see estimated difficulty.
      </div>

      <div id="advancedWarning" class="advanced-warning hidden">
        ⚠ Start AND end mode is extremely difficult and CPU intensive.
        Use short patterns first.
      </div>

      <br>

      <label>Engine</label>
      <select id="engine">
        <option value="kit" selected>Solana Kit</option>
        <option value="web3">web3.js (Legacy)</option>
      </select>

      <div class="engine-info">
        <strong>Engine info</strong><br>
        Solana Kit is the modern default engine.<br>
        web3.js is kept as legacy fallback mode.
      </div>

      <br><br>

      <label>Workers</label>
      <select id="workerCount">
        <option value="auto" selected>Auto Recommended</option>
        <option value="1">1 Worker</option>
        <option value="2">2 Workers</option>
        <option value="4">4 Workers</option>
        <option value="8">8 Workers</option>
        <option value="max">Max Device Threads</option>
      </select>

      <br><br>

      <button id="startBtn">Start Search</button>
      <button id="stopBtn">Stop Search</button>
    </div>

    <div class="card">
      <h2>Status</h2>
      <div id="status">Waiting...</div>
    </div>

    <div class="card">
      <h2>Recent Found Wallets</h2>
      <div id="recentWallets">No recent wallets yet.</div>
      <button id="clearRecentBtn">Clear Recent Wallets</button>
    </div>

    <footer class="footer">
      Built locally in your browser • No backend • No cloud key storage<br>
      Open source on
      <a href="https://github.com/smitskecbs/cbs-local-wallet-generator" target="_blank">
        GitHub
      </a>
    </footer>
  </div>
`;var l=document.getElementById(`startBtn`),u=document.getElementById(`stopBtn`),d=document.getElementById(`status`),f=document.getElementById(`position`),p=document.getElementById(`workerCount`),m=document.getElementById(`engine`),h=document.getElementById(`ignoreCase`),g=document.getElementById(`patternFields`),_=document.getElementById(`recentWallets`),v=document.getElementById(`clearRecentBtn`),y=document.getElementById(`estimateBox`),b=document.getElementById(`advancedWarning`);function x(e){let t=(e||``).toLowerCase();return t===`kit`||t===`solana-kit`||t===`solana kit`}function S(e){return x(e)?`Kit`:`web3.js`}function C(){let e=f.value;e===`prefix`&&(g.innerHTML=`
      <label>Start pattern</label>
      <input id="pattern" maxlength="5" placeholder="Example: CBS" />
    `),e===`suffix`&&(g.innerHTML=`
      <label>End pattern</label>
      <input id="pattern" maxlength="5" placeholder="Example: BONK" />
    `),e===`both`&&(g.innerHTML=`
      <label>Pattern</label>
      <input id="pattern" maxlength="5" placeholder="Example: SOL" />
    `),e===`bothEnds`&&(g.innerHTML=`
      <label>Start pattern</label>
      <input id="pattern" maxlength="5" placeholder="Example: CBS" />

      <label>End pattern</label>
      <input id="endPattern" maxlength="5" placeholder="Example: SOL" />
    `),w()?.addEventListener(`input`,B),T()?.addEventListener(`input`,B),B()}function w(){return document.getElementById(`pattern`)}function T(){return document.getElementById(`endPattern`)}function E(){return w()?.value.trim()||``}function D(){return T()?.value.trim()||``}function O(){n=!1,i.forEach(e=>e.terminate()),i=[]}function k(e){return s.some(t=>e.includes(t))}function A(e){return s.filter(t=>e.includes(t))}function j(){let e=(Date.now()-a)/1e3;if(e<=0)return 0;let t=Math.round(r/e);return t>0&&(o=t),t}function M(){let e=localStorage.getItem(c);if(!e)return[];try{return JSON.parse(e)}catch{return[]}}function N(e){let t=M();t.unshift(e),localStorage.setItem(c,JSON.stringify(t.slice(0,10))),P()}function P(){let e=M();if(e.length===0){_.innerHTML=`No recent wallets yet.`;return}_.innerHTML=e.map(e=>{let t=x(e.engine)?`Elapsed: ${(e.elapsed||0).toFixed(2)}s<br>`:`
          Attempts: ${e.attempts||0}<br>
          Speed: ${e.speed||0} wallets/sec<br>
        `;return`
        <div class="wallet-box">
          <div class="wallet-title">
            ${e.pattern} / ${e.position}
          </div>

          <div class="wallet-key">
            ${e.publicKey}
          </div>

          <br>

          Engine: ${S(e.engine)}<br>
          ${t}
          Date: ${e.createdAt}

          <br><br>

          <button class="copyRecentBtn" data-public-key="${e.publicKey}">
            Copy Public Key
          </button>
        </div>
      `}).join(``),document.querySelectorAll(`.copyRecentBtn`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-public-key`);t&&(navigator.clipboard.writeText(t),alert(`Public key copied!`))})})}function F(e){return e<500?`Common`:e<1e4?`Uncommon`:e<5e5?`Rare`:e<2e7?`Epic`:e<2e9?`Legendary`:`Insane`}function I(e){return e===`Common`?`⚪`:e===`Uncommon`?`🟢`:e===`Rare`?`🔵`:e===`Epic`?`🟣`:e===`Legendary`?`🟡`:`🔥`}function L(e){if(e<1)return`less than 1 second`;if(e<60)return Math.round(e)+` seconds`;let t=e/60;if(t<60)return Math.round(t)+` minutes`;let n=t/60;if(n<24)return Math.round(n*10)/10+` hours`;let r=n/24;if(r<365)return Math.round(r*10)/10+` days`;let i=r/365;return Math.round(i*10)/10+` years`}function R(e,t){if(!t)return 1;let n=1;for(let t of e){let e=t.toLowerCase(),r=t.toUpperCase(),i=!s.includes(e),a=!s.includes(r);e!==r&&i&&a&&(n*=2)}return n}function z(){f.value===`bothEnds`?b.classList.remove(`hidden`):b.classList.add(`hidden`)}function B(){let e=E(),t=D(),n=f.value,r=h.checked;if(z(),!e){y.innerHTML=`Enter a pattern to see estimated difficulty.`;return}if(k(e)||k(t)){y.innerHTML=`
      <strong>Invalid pattern</strong><br>
      Not allowed: ${[...A(e),...A(t)].join(`, `)}
    `;return}if(n===`bothEnds`&&!t){y.innerHTML=`
      <strong>Start AND end mode</strong><br>
      Enter both a start pattern and an end pattern.<br><br>
      Example: start = CBS, end = SOL
    `;return}let i=e.length,a=R(e,r),s=1;n===`both`&&(s=2),n===`bothEnds`&&(i=e.length+t.length,a=R(e,r)*R(t,r));let c=Math.round(58**i/a/s),l=c/(o>0?o:5e4),u=F(c);y.innerHTML=`
    <strong>Rarity:</strong> ${I(u)} ${u}<br>
    <strong>Average attempts:</strong> ${c.toLocaleString()}<br>
    <strong>Estimated average time:</strong> ${L(l)}<br>
    <small>This is an average estimate. It can be found much faster or much slower.</small>
  `}function V(e){let t=j(),n=((Date.now()-a)/1e3).toFixed(1),i=m.value===`kit`;d.innerHTML=`
    <div class="status-searching">
      <strong>Searching...</strong>

      <br><br>

      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-title">Engine</div>
          <div class="stat-value">${i?`Kit`:`web3.js`}</div>
        </div>

        <div class="stat-box">
          <div class="stat-title">Workers</div>
          <div class="stat-value">${e}</div>
        </div>

        ${i?`
              <div class="stat-box">
                <div class="stat-title">Elapsed</div>
                <div class="stat-value">${n}s</div>
              </div>
            `:`
              <div class="stat-box">
                <div class="stat-title">Attempts</div>
                <div class="stat-value">${r}</div>
              </div>

              <div class="stat-box">
                <div class="stat-title">Speed</div>
                <div class="stat-value">${t}</div>
              </div>
            `}
      </div>

      ${i?`Searching for vanity address with Solana Kit...`:`wallets/sec`}
    </div>
  `,B()}function H(){let e=p.value,t=navigator.hardwareConcurrency||4;return e===`auto`?Math.max(1,Math.floor(t/2)):e===`max`?t:Number(e)}function U(e,t){let n=`CBS Local Wallet Generator

==============================

Public Key:
`+e+`

==============================

Private Key:
`+t+`

==============================

IMPORT INSTRUCTIONS:
1. Open Phantom, Solflare, Backpack or another Solana wallet.
2. Choose Add / Import Wallet.
3. Choose Private Key.
4. Paste the private key.
5. Save the wallet.

WARNING:
Never share your private key.
Anyone with this key has full access to your wallet.
`,r=new Blob([n],{type:`text/plain`}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=`wallet-`+e+`.txt`,a.click(),URL.revokeObjectURL(i)}function W(e,t){let n=Array.from(e),r=new Blob([JSON.stringify(n)],{type:`application/json`}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=`wallet-`+t+`.json`,a.click(),URL.revokeObjectURL(i)}f.addEventListener(`change`,()=>{C()}),h.addEventListener(`change`,B),p.addEventListener(`change`,B),m.addEventListener(`change`,B),v?.addEventListener(`click`,()=>{localStorage.removeItem(c),P()}),u?.addEventListener(`click`,()=>{O(),d.innerHTML=`
    <div class="status-searching">
      Search stopped.
    </div>
  `}),l?.addEventListener(`click`,()=>{let e=E(),t=D(),o=f.value,s=H(),c=h.checked;if(!e){d.innerHTML=`
      <div class="status-searching">
        Please enter a pattern.
      </div>
    `;return}if(o===`bothEnds`&&!t){d.innerHTML=`
      <div class="status-searching">
        Please enter an end pattern for Start AND end mode.
      </div>
    `;return}if(k(e)||k(t)){d.innerHTML=`
      <div class="status-searching">
        <strong>Invalid pattern</strong><br><br>
        These characters are not allowed in Solana Base58 addresses:<br><br>
        <strong>${[...A(e),...A(t)].join(`, `)}</strong><br><br>
        Please remove them and try again.
      </div>
    `;return}if(O(),n=!0,r=0,a=Date.now(),m.value===`kit`){let e=setInterval(()=>{if(!n){clearInterval(e);return}V(s)},100)}V(s);for(let a=0;a<s;a++){let a;a=m.value===`kit`?new Worker(new URL(``+new URL(`kitWorker-MpHRx3wk.js`,import.meta.url).href,``+import.meta.url),{type:`module`}):new Worker(new URL(``+new URL(`walletWorker-Bc4-AF8J.js`,import.meta.url).href,``+import.meta.url),{type:`module`}),a.onmessage=i=>{if(n&&(i.data.type===`attempt`&&(r++,r%1e3==0&&V(s)),i.data.type!==`started`&&i.data.type===`found`)){let n=i.data.publicKey,a=i.data.privateKey,c=new Uint8Array(i.data.secretKey),l=i.data.engine||m.value,u=i.data.seconds||0;O();let f=j(),p=o===`bothEnds`?e+`...`+t:e,h=x(l);N({publicKey:n,pattern:p,position:o,engine:h?`Kit`:`web3.js`,attempts:h?void 0:r,speed:h?void 0:f,elapsed:h?u:void 0,createdAt:new Date().toLocaleString()}),d.innerHTML=`
          <div class="status-found">
            <strong>MATCH FOUND</strong>

            <br><br>

            <div class="stat-grid">
              <div class="stat-box">
                <div class="stat-title">Engine</div>
                <div class="stat-value">${h?`Kit`:`web3.js`}</div>
              </div>

              <div class="stat-box">
                <div class="stat-title">Workers</div>
                <div class="stat-value">${s}</div>
              </div>

              ${h?`
                    <div class="stat-box">
                      <div class="stat-title">Elapsed</div>
                      <div class="stat-value">${u.toFixed(2)}s</div>
                    </div>
                  `:`
                    <div class="stat-box">
                      <div class="stat-title">Attempts</div>
                      <div class="stat-value">${r}</div>
                    </div>

                    <div class="stat-box">
                      <div class="stat-title">Speed</div>
                      <div class="stat-value">${f}</div>
                    </div>
                  `}
            </div>

            <div class="wallet-box">
              <div class="wallet-title">Public Key</div>
              <div class="wallet-key">${n}</div>
              <button id="copyPublicBtn">Copy Public Key</button>
            </div>

            <div class="wallet-box">
              <div class="wallet-title">Private Key</div>
              <div class="wallet-key">${a}</div>
              <button id="copyPrivateBtn">Copy Private Key</button>
            </div>

            <button id="downloadBtn">Download Wallet Backup (.txt)</button>
            <button id="downloadJsonBtn">Download JSON Keypair</button>

            <div class="import-box">
              <strong>Import into a Solana wallet</strong><br><br>
              1. Open Phantom, Solflare, Backpack or another Solana wallet.<br>
              2. Choose Add / Import Wallet.<br>
              3. Choose Private Key.<br>
              4. Paste the private key.<br>
              5. Save the wallet.
            </div>

            <p class="danger">
              Keep this file offline. Never share your private key.
            </p>
          </div>
        `,document.getElementById(`copyPublicBtn`)?.addEventListener(`click`,()=>{navigator.clipboard.writeText(n),alert(`Public key copied!`)}),document.getElementById(`copyPrivateBtn`)?.addEventListener(`click`,()=>{navigator.clipboard.writeText(a),alert(`Private key copied!`)}),document.getElementById(`downloadBtn`)?.addEventListener(`click`,()=>{U(n,a)}),document.getElementById(`downloadJsonBtn`)?.addEventListener(`click`,()=>{W(c,n)})}},a.postMessage({pattern:e,endPattern:t,position:o,ignoreCase:c}),i.push(a)}}),P(),C();