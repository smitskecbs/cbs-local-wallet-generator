(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=``+new URL(`banner-DxL4ycpa.png`,import.meta.url).href,t=document.querySelector(`#app`);if(!t)throw Error(`App element not found`);var n=!1,r=0,i=[],a=0,o=0,s=[`0`,`O`,`I`,`l`],c=`cbs-recent-wallets`;t.innerHTML=`
  <div class="container">
    <div class="hero">
      <img src="${e}" alt="CBS Wallet Generator Banner" />
    </div>

   <div class="intro-box reveal">
  <strong>Create a custom Solana wallet address</strong><br><br>
  1. Enter a short word like CBS or BONK.<br>
  2. Click Start Search.<br>
  3. When a match is found, save your wallet backup safely.<br><br>
  Everything runs locally on your device.
</div>

<div class="import-box reveal">
  <strong>Safety notice</strong><br><br>
  Never share your private key.<br>
  Anyone with your private key can access your wallet.
</div>

      <br>

      <label>Where should the word appear?</label>
      <select id="position">
        <option value="prefix">Start of wallet</option>
        <option value="suffix">End of wallet</option>
        <option value="both">Start OR end of wallet</option>
        <option value="bothEnds">Start AND end of wallet</option>
      </select>

      <div id="patternFields"></div>

      <div class="checkbox-row">
        <input id="ignoreCase" type="checkbox" />
        <label for="ignoreCase">Match uppercase and lowercase</label>
      </div>

      <p>Invalid characters: 0 O I l</p>

      <div id="estimateBox" class="import-box reveal">
        Enter a pattern to see estimated difficulty.
      </div>

      <div id="advancedWarning" class="advanced-warning hidden">
        ⚠ Start AND end mode is extremely difficult and CPU intensive.
        Use short patterns first.
      </div>

      <br>

<div id="advancedOptions" class="collapsed">
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
      </div>
      <br><br>

     <button id="startBtn">Generate Wallet</button>
      <button id="stopBtn">Stop</button>
      <button id="toggleAdvancedBtn" type="button">
        Show Advanced
      </button>
    </div>

    <div class="card reveal">
      <h2>Status</h2>
      <div id="status">Waiting...</div>
    </div>

    <div id="statusModal" class="modal-overlay hidden">
      <div class="modal-panel">
        <div class="modal-header">
          <div>
            <h2>Generation Status</h2>
            <p class="modal-subtitle">Live search progress</p>
          </div>
          <button id="closeModalBtn" class="modal-close" type="button">×</button>
        </div>
        <div id="modalStatus" class="modal-status">
          Waiting...
        </div>
        <div class="modal-actions">
          <button id="modalStopBtn" type="button">Stop</button>
        </div>
      </div>
    </div>

    <div class="card reveal">
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
`;var l=document.getElementById(`startBtn`),u=document.getElementById(`stopBtn`),d=document.getElementById(`status`),f=document.getElementById(`statusModal`),p=document.getElementById(`modalStatus`),m=document.getElementById(`modalStopBtn`),h=document.getElementById(`closeModalBtn`),g=document.getElementById(`position`),_=document.getElementById(`workerCount`),v=document.getElementById(`engine`),y=document.getElementById(`ignoreCase`),b=document.getElementById(`patternFields`),x=document.getElementById(`recentWallets`),S=document.getElementById(`clearRecentBtn`),C=document.getElementById(`estimateBox`),w=document.getElementById(`advancedWarning`),T=document.getElementById(`toggleAdvancedBtn`),E=document.getElementById(`advancedOptions`);T?.addEventListener(`click`,()=>{E?.classList.toggle(`collapsed`),T.textContent=E?.classList.contains(`collapsed`)?`Show Advanced`:`Hide Advanced`});function D(e){d&&(d.innerHTML=e),p&&(p.innerHTML=e)}function O(e,t,n,r){e&&(e.querySelector(`#copyPublicBtn`)?.addEventListener(`click`,()=>{navigator.clipboard.writeText(t),alert(`Public key copied!`)}),e.querySelector(`#copyPrivateBtn`)?.addEventListener(`click`,()=>{navigator.clipboard.writeText(n),alert(`Private key copied!`)}),e.querySelector(`#downloadBtn`)?.addEventListener(`click`,()=>{ee(t,n)}),e.querySelector(`#downloadJsonBtn`)?.addEventListener(`click`,()=>{te(r,t)}))}function k(e,t,n){O(d,e,t,n),O(p,e,t,n)}function A(){f&&(f.classList.remove(`hidden`),setTimeout(()=>{f.classList.add(`open`)},20))}function j(){f&&(f.classList.remove(`open`),f.addEventListener(`transitionend`,()=>{f.classList.add(`hidden`)},{once:!0}))}m?.addEventListener(`click`,()=>{u?.click()}),h?.addEventListener(`click`,()=>{j()});function M(e){let t=(e||``).toLowerCase();return t===`kit`||t===`solana-kit`||t===`solana kit`}function N(e){return M(e)?`Kit`:`web3.js`}function P(){let e=g.value;e===`prefix`&&(b.innerHTML=`
      <label>Start pattern</label>
      <input id="pattern" maxlength="5" placeholder="Example: CBS" />
    `),e===`suffix`&&(b.innerHTML=`
      <label>End pattern</label>
      <input id="pattern" maxlength="5" placeholder="Example: BONK" />
    `),e===`both`&&(b.innerHTML=`
      <label>Pattern</label>
      <input id="pattern" maxlength="5" placeholder="Example: SOL" />
    `),e===`bothEnds`&&(b.innerHTML=`
      <label>Start pattern</label>
      <input id="pattern" maxlength="5" placeholder="Example: CBS" />

      <label>End pattern</label>
      <input id="endPattern" maxlength="5" placeholder="Example: SOL" />
    `),F()?.addEventListener(`input`,Z),I()?.addEventListener(`input`,Z),Z()}function F(){return document.getElementById(`pattern`)}function I(){return document.getElementById(`endPattern`)}function L(){return F()?.value.trim()||``}function R(){return I()?.value.trim()||``}function z(){n=!1,i.forEach(e=>e.terminate()),i=[]}function B(e){return s.some(t=>e.includes(t))}function V(e){return s.filter(t=>e.includes(t))}function H(){let e=(Date.now()-a)/1e3;if(e<=0)return 0;let t=Math.round(r/e);return t>0&&(o=t),t}function U(){let e=localStorage.getItem(c);if(!e)return[];try{return JSON.parse(e)}catch{return[]}}function W(e){let t=U();t.unshift(e),localStorage.setItem(c,JSON.stringify(t.slice(0,10))),G()}function G(){let e=U();if(e.length===0){x.innerHTML=`No recent wallets yet.`;return}x.innerHTML=e.map(e=>{let t=M(e.engine)?`Elapsed: ${(e.elapsed||0).toFixed(2)}s<br>`:`
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

          Engine: ${N(e.engine)}<br>
          ${t}
          Date: ${e.createdAt}

          <br><br>

          <button class="copyRecentBtn" data-public-key="${e.publicKey}">
            Copy Public Key
          </button>
        </div>
      `}).join(``),document.querySelectorAll(`.copyRecentBtn`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-public-key`);t&&(navigator.clipboard.writeText(t),alert(`Public key copied!`))})})}function K(e){return e<500?`Common`:e<1e4?`Uncommon`:e<5e5?`Rare`:e<2e7?`Epic`:e<2e9?`Legendary`:`Insane`}function q(e){return e===`Common`?`⚪`:e===`Uncommon`?`🟢`:e===`Rare`?`🔵`:e===`Epic`?`🟣`:e===`Legendary`?`🟡`:`🔥`}function J(e){if(e<1)return`less than 1 second`;if(e<60)return Math.round(e)+` seconds`;let t=e/60;if(t<60)return Math.round(t)+` minutes`;let n=t/60;if(n<24)return Math.round(n*10)/10+` hours`;let r=n/24;if(r<365)return Math.round(r*10)/10+` days`;let i=r/365;return Math.round(i*10)/10+` years`}function Y(e,t){if(!t)return 1;let n=1;for(let t of e){let e=t.toLowerCase(),r=t.toUpperCase(),i=!s.includes(e),a=!s.includes(r);e!==r&&i&&a&&(n*=2)}return n}function X(){g.value===`bothEnds`?w.classList.remove(`hidden`):w.classList.add(`hidden`)}function Z(){let e=L(),t=R(),n=g.value,r=y.checked;if(X(),!e){C.innerHTML=`Enter a pattern to see estimated difficulty.`;return}if(B(e)||B(t)){C.innerHTML=`
      <strong>Invalid pattern</strong><br>
      Not allowed: ${[...V(e),...V(t)].join(`, `)}
    `;return}if(n===`bothEnds`&&!t){C.innerHTML=`
      <strong>Start AND end mode</strong><br>
      Enter both a start pattern and an end pattern.<br><br>
      Example: start = CBS, end = SOL
    `;return}let i=e.length,a=Y(e,r),s=1;n===`both`&&(s=2),n===`bothEnds`&&(i=e.length+t.length,a=Y(e,r)*Y(t,r));let c=Math.round(58**i/a/s),l=c/(o>0?o:5e4),u=K(c);C.innerHTML=`
    <strong>Rarity:</strong> ${q(u)} ${u}<br>
    <strong>Average attempts:</strong> ${c.toLocaleString()}<br>
    <strong>Estimated average time:</strong> ${J(l)}<br>
    <small>This is an average estimate. It can be found much faster or much slower.</small>
  `}function Q(e){let t=H(),n=((Date.now()-a)/1e3).toFixed(1),i=v.value===`kit`;D(`
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
  `),Z()}function $(){let e=_.value,t=navigator.hardwareConcurrency||4;return e===`auto`?Math.max(1,Math.floor(t/2)):e===`max`?t:Number(e)}function ee(e,t){let n=`CBS Local Wallet Generator

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
`,r=new Blob([n],{type:`text/plain`}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=`wallet-`+e+`.txt`,a.click(),URL.revokeObjectURL(i)}function te(e,t){let n=Array.from(e),r=new Blob([JSON.stringify(n)],{type:`application/json`}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=`wallet-`+t+`.json`,a.click(),URL.revokeObjectURL(i)}g.addEventListener(`change`,()=>{P()}),y.addEventListener(`change`,Z),_.addEventListener(`change`,Z),v.addEventListener(`change`,Z),S?.addEventListener(`click`,()=>{localStorage.removeItem(c),G()}),u?.addEventListener(`click`,()=>{z(),D(`
    <div class="status-searching">
      Search stopped.
    </div>
  `)}),l?.addEventListener(`click`,()=>{let e=L(),t=R(),o=g.value,s=$(),c=y.checked;if(!e){D(`
      <div class="status-searching">
        Please enter a pattern.
      </div>
    `);return}if(o===`bothEnds`&&!t){D(`
      <div class="status-searching">
        Please enter an end pattern for Start AND end mode.
      </div>
    `);return}if(B(e)||B(t)){D(`
      <div class="status-searching">
        <strong>Invalid pattern</strong><br><br>
        These characters are not allowed in Solana Base58 addresses:<br><br>
        <strong>${[...V(e),...V(t)].join(`, `)}</strong><br><br>
        Please remove them and try again.
      </div>
    `);return}if(z(),n=!0,r=0,a=Date.now(),A(),v.value===`kit`){let e=setInterval(()=>{if(!n){clearInterval(e);return}Q(s)},100)}Q(s);for(let a=0;a<s;a++){let a;a=v.value===`kit`?new Worker(new URL(``+new URL(`kitWorker-MpHRx3wk.js`,import.meta.url).href,``+import.meta.url),{type:`module`}):new Worker(new URL(``+new URL(`walletWorker-Bc4-AF8J.js`,import.meta.url).href,``+import.meta.url),{type:`module`}),a.onmessage=i=>{if(n&&(i.data.type===`attempt`&&(r++,r%1e3==0&&Q(s)),i.data.type!==`started`&&i.data.type===`found`)){let n=i.data.publicKey,a=i.data.privateKey,c=new Uint8Array(i.data.secretKey),l=i.data.engine||v.value,u=i.data.seconds||0;z();let d=H(),f=o===`bothEnds`?e+`...`+t:e,p=M(l);W({publicKey:n,pattern:f,position:o,engine:p?`Kit`:`web3.js`,attempts:p?void 0:r,speed:p?void 0:d,elapsed:p?u:void 0,createdAt:new Date().toLocaleString()}),D(`
          <div class="status-found">
            <strong>MATCH FOUND</strong>

            <br><br>

            <div class="stat-grid">
              <div class="stat-box">
                <div class="stat-title">Engine</div>
                <div class="stat-value">${p?`Kit`:`web3.js`}</div>
              </div>

              <div class="stat-box">
                <div class="stat-title">Workers</div>
                <div class="stat-value">${s}</div>
              </div>

              ${p?`
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
                      <div class="stat-value">${d}</div>
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
        `),k(n,a,c)}},a.postMessage({pattern:e,endPattern:t,position:o,ignoreCase:c}),i.push(a)}}),G(),P(),ne();function ne(){let e=document.querySelectorAll(`.reveal`);if(`IntersectionObserver`in window){let t=new IntersectionObserver(e=>{for(let n of e)n.isIntersecting&&(n.target.classList.add(`visible`),t.unobserve(n.target))},{threshold:.15});e.forEach(e=>t.observe(e))}else e.forEach(e=>e.classList.add(`visible`))}