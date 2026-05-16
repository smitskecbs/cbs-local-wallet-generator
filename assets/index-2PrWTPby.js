(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=``+new URL(`banner-CfPUQrU6.png`,import.meta.url).href,t=document.querySelector(`#app`);if(!t)throw Error(`App element not found`);var n=!1,r=0,i=[],a=0,o=0,s=[`0`,`O`,`I`,`l`],c=`cbs-recent-wallets`;t.innerHTML=`
  <div class="container">
    <div class="hero">
      <img src="${e}" alt="CBS Wallet Generator Banner" />
    </div>

    <div class="card">
      <label>Pattern</label>
      <input id="pattern" maxlength="5" placeholder="Example: CBS" />

      <div class="checkbox-row">
  <input id="ignoreCase" type="checkbox" />

  <label for="ignoreCase">
    Ignore letter casing
  </label>
</div>

      <p>Invalid characters: 0 O I l</p>

      <div id="estimateBox" class="import-box">
        Enter a pattern to see estimated difficulty.
      </div>

      <br>

      <label>Match position</label>
      <select id="position">
        <option value="prefix">Start of wallet</option>
        <option value="suffix">End of wallet</option>
      </select>

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
  </div>
`;var l=document.getElementById(`startBtn`),u=document.getElementById(`stopBtn`),d=document.getElementById(`status`),f=document.getElementById(`pattern`),p=document.getElementById(`ignoreCase`),m=document.getElementById(`position`),h=document.getElementById(`workerCount`),g=document.getElementById(`recentWallets`),_=document.getElementById(`clearRecentBtn`),v=document.getElementById(`estimateBox`);function y(){n=!1,i.forEach(e=>e.terminate()),i=[]}function b(e){return s.some(t=>e.includes(t))}function x(e){return s.filter(t=>e.includes(t))}function S(){let e=(Date.now()-a)/1e3;if(e<=0)return 0;let t=Math.round(r/e);return t>0&&(o=t),t}function C(){let e=localStorage.getItem(c);if(!e)return[];try{return JSON.parse(e)}catch{return[]}}function w(e){let t=C();t.unshift(e),localStorage.setItem(c,JSON.stringify(t.slice(0,10))),T()}function T(){let e=C();if(e.length===0){g.innerHTML=`No recent wallets yet.`;return}g.innerHTML=e.map(e=>`
        <div class="wallet-box">
          <div class="wallet-title">
            ${e.pattern} / ${e.position}
          </div>

          <div class="wallet-key">
            ${e.publicKey}
          </div>

          <br>

          Attempts: ${e.attempts}<br>
          Speed: ${e.speed} wallets/sec<br>
          Date: ${e.createdAt}

          <br><br>

          <button class="copyRecentBtn" data-public-key="${e.publicKey}">
            Copy Public Key
          </button>
        </div>
      `).join(``),document.querySelectorAll(`.copyRecentBtn`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-public-key`);t&&(navigator.clipboard.writeText(t),alert(`Public key copied!`))})})}function E(e){return e<500?`Very easy`:e<1e4?`Easy`:e<5e5?`Medium`:e<2e7?`Hard`:`Very hard`}function D(e){if(e<1)return`less than 1 second`;if(e<60)return Math.round(e)+` seconds`;let t=e/60;if(t<60)return Math.round(t)+` minutes`;let n=t/60;if(n<24)return Math.round(n*10)/10+` hours`;let r=n/24;return Math.round(r*10)/10+` days`}function O(e,t){if(!t)return 1;let n=1;for(let t of e){let e=t.toLowerCase(),r=t.toUpperCase(),i=!s.includes(e),a=!s.includes(r);e!==r&&i&&a&&(n*=2)}return n}function k(){let e=f.value.trim(),t=p.checked;if(!e){v.innerHTML=`Enter a pattern to see estimated difficulty.`;return}if(b(e)){v.innerHTML=`
      <strong>Invalid pattern</strong><br>
      Not allowed: ${x(e).join(`, `)}
    `;return}let n=58**e.length,r=O(e,t),i=Math.round(n/r),a=i/(o>0?o:5e4);v.innerHTML=`
    <strong>Estimated difficulty:</strong> ${E(i)}<br>
    <strong>Average attempts:</strong> ${i.toLocaleString()}<br>
    <strong>Estimated average time:</strong> ${D(a)}<br>
    <small>This is an average estimate. It can be found much faster or much slower.</small>
  `}function A(e){let t=S();d.innerHTML=`
    <div class="status-searching">
      <strong>Searching...</strong>

      <br><br>

      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-title">Workers</div>
          <div class="stat-value">${e}</div>
        </div>

        <div class="stat-box">
          <div class="stat-title">Attempts</div>
          <div class="stat-value">${r}</div>
        </div>

        <div class="stat-box">
          <div class="stat-title">Speed</div>
          <div class="stat-value">${t}</div>
        </div>
      </div>

      wallets/sec
    </div>
  `,k()}function j(){let e=h.value,t=navigator.hardwareConcurrency||4;return e===`auto`?Math.max(1,Math.floor(t/2)):e===`max`?t:Number(e)}function M(e,t){let n=`CBS Local Wallet Generator

==============================

Public Key:
`+e+`

==============================

Private Key:
`+t+`

==============================

IMPORT INSTRUCTIONS:
1. Open Phantom or Solflare.
2. Choose Add / Import Wallet.
3. Choose Private Key.
4. Paste the private key.
5. Save the wallet.

WARNING:
Never share your private key.
Anyone with this key has full access to your wallet.
`,r=new Blob([n],{type:`text/plain`}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=`wallet-`+e+`.txt`,a.click(),URL.revokeObjectURL(i)}function N(e,t){let n=Array.from(e),r=new Blob([JSON.stringify(n)],{type:`application/json`}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=`wallet-`+t+`.json`,a.click(),URL.revokeObjectURL(i)}f.addEventListener(`input`,k),p.addEventListener(`change`,k),h.addEventListener(`change`,k),_?.addEventListener(`click`,()=>{localStorage.removeItem(c),T()}),u?.addEventListener(`click`,()=>{y(),d.innerHTML=`
    <div class="status-searching">
      Search stopped.
    </div>
  `}),l?.addEventListener(`click`,()=>{let e=f.value.trim(),t=m.value,o=j(),s=p.checked;if(!e){d.innerHTML=`
      <div class="status-searching">
        Please enter a pattern.
      </div>
    `;return}if(b(e)){d.innerHTML=`
      <div class="status-searching">
        <strong>Invalid pattern</strong><br><br>
        These characters are not allowed in Solana Base58 addresses:<br><br>
        <strong>${x(e).join(`, `)}</strong><br><br>
        Please remove them and try again.
      </div>
    `;return}y(),n=!0,r=0,a=Date.now(),d.innerHTML=`
    <div class="status-searching">
      Starting search with ${o} workers...
    </div>
  `;for(let a=0;a<o;a++){let a=new Worker(new URL(``+new URL(`walletWorker-BxY1PCA0.js`,import.meta.url).href,``+import.meta.url),{type:`module`});a.onmessage=i=>{if(n&&(i.data.type===`attempt`&&(r++,r%1e3==0&&A(o)),i.data.type===`found`)){let n=i.data.publicKey,a=i.data.privateKey,s=new Uint8Array(i.data.secretKey);y();let c=S();w({publicKey:n,pattern:e,position:t,attempts:r,speed:c,createdAt:new Date().toLocaleString()}),d.innerHTML=`
          <div class="status-found">
            <strong>MATCH FOUND</strong>

            <br><br>

            <div class="stat-grid">
              <div class="stat-box">
                <div class="stat-title">Workers</div>
                <div class="stat-value">${o}</div>
              </div>

              <div class="stat-box">
                <div class="stat-title">Attempts</div>
                <div class="stat-value">${r}</div>
              </div>

              <div class="stat-box">
                <div class="stat-title">Speed</div>
                <div class="stat-value">${c}</div>
              </div>
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
              <strong>Import into Phantom or Solflare</strong><br><br>
              1. Open Phantom or Solflare.<br>
              2. Choose Add / Import Wallet.<br>
              3. Choose Private Key.<br>
              4. Paste the private key.<br>
              5. Save the wallet.
            </div>

            <p class="danger">
              Keep this file offline. Never share your private key.
            </p>
          </div>
        `,document.getElementById(`copyPublicBtn`)?.addEventListener(`click`,()=>{navigator.clipboard.writeText(n),alert(`Public key copied!`)}),document.getElementById(`copyPrivateBtn`)?.addEventListener(`click`,()=>{navigator.clipboard.writeText(a),alert(`Private key copied!`)}),document.getElementById(`downloadBtn`)?.addEventListener(`click`,()=>{M(n,a)}),document.getElementById(`downloadJsonBtn`)?.addEventListener(`click`,()=>{N(s,n)})}},a.postMessage({pattern:e,position:t,ignoreCase:s}),i.push(a)}}),T(),k();