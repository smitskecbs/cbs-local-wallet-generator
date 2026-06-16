(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=``+new URL(`banner-DxL4ycpa.png`,import.meta.url).href,t=document.querySelector(`#app`);if(!t)throw Error(`App element not found`);var n=!1,r=0,i=[],a=0,o=0,s=[`0`,`O`,`I`,`l`],c=`cbs-recent-wallets`,l=44,u=`ManGofryUWC5VWk7t4ATP32qJtGVBBNoVi2AQ9HyR9J`;t.innerHTML=`
  <main class="app-shell">
    <header class="site-hero" aria-labelledby="hero-heading">
      <img
        id="hero-heading"
        class="site-banner"
        src="${e}"
        alt="CBS Wallet Generator"
      />
      <p class="site-hero-subtitle">
        Create custom Solana wallet addresses locally in your browser.
      </p>
    </header>

    <section class="page-section">
      <div class="page-overview edu-block reveal">
        <p class="edu-block-title">Page overview</p>
        <h1 class="edu-block-heading">CBS Wallet Generator</h1>
        <p class="edu-block-text">
          Search for a Solana wallet address that contains your chosen word at the start,
          end, or both. Keys are generated on your device and never sent to a server.
        </p>
        <ol class="edu-block-list">
          <li>Enter a short word like CBS or BONK.</li>
          <li>Click Generate Wallet.</li>
          <li>When a match is found, save your wallet backup safely.</li>
        </ol>
      </div>
    </section>

    <section class="page-section card reveal">
      <h2>Generate Wallet</h2>

      <div class="import-box reveal">
        <strong>Safety notice</strong><br><br>
        Never share your private key.<br>
        Anyone with your private key can access your wallet.
      </div>

      <label>Where should the word appear?</label>
      <select id="position">
        <option value="prefix">Start of wallet</option>
        <option value="suffix">End of wallet</option>
        <option value="both">Start OR end of wallet</option>
        <option value="bothEnds">Start AND end of wallet</option>
        <option value="anywhere">Anywhere in wallet</option>
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

      <div class="button-row">
        <button id="startBtn" type="button">Generate Wallet</button>
        <button id="stopBtn" class="secondary-btn" type="button">Stop</button>
        <button id="toggleAdvancedBtn" class="secondary-btn" type="button">
          Show Advanced
        </button>
      </div>
    </section>

    <section class="page-section card reveal">
      <h2>Status</h2>
      <div id="status">Waiting...</div>
    </section>

    <div id="statusModal" class="modal-overlay hidden">
      <div class="modal-panel">
        <div class="modal-header">
          <div>
            <h2>Generation Status</h2>
            <p class="modal-subtitle">Live search progress</p>
          </div>
          <button id="closeModalBtn" class="modal-close secondary-btn" type="button">×</button>
        </div>
        <div id="modalStatus" class="modal-status">
          Waiting...
        </div>
        <div class="modal-actions">
          <button id="modalStopBtn" class="secondary-btn" type="button">Stop</button>
        </div>
      </div>
    </div>

    <section class="page-section card reveal">
      <h2>Recent Found Wallets</h2>
      <div id="recentWallets">No recent wallets yet.</div>
      <button id="clearRecentBtn" class="secondary-btn" type="button">Clear Recent Wallets</button>
    </section>

    <section class="support-section" aria-labelledby="support-title">
      <div class="support-card">
        <p class="support-title" id="support-title">Support CBS Ecosystem</p>
        <p class="support-text">
          Optional donations help fund development and infrastructure.
        </p>
        <code class="support-wallet" data-donation-wallet>${u}</code>
        <button
          type="button"
          class="secondary-btn support-copy-btn"
          id="donationCopyBtn"
        >
          Copy address
        </button>
        <p
          class="support-confirm"
          id="donationConfirm"
          hidden
          aria-live="polite"
        >
          Address copied.
        </p>
      </div>
    </section>

    <footer class="site-footer reveal">
      <nav class="footer-links" aria-label="CBS ecosystem">
        <a href="https://tools.cbs-coin.com" target="_blank" rel="noopener noreferrer">CBS Tools</a>
        <a href="https://cbs-coin.com" target="_blank" rel="noopener noreferrer">CBS Coin</a>
      </nav>
      <section class="footer-open-source" aria-labelledby="footer-open-title">
        <h2 class="footer-open-title" id="footer-open-title">Built in the Open</h2>
        <p class="footer-open-text">
          CBS Tools is developed publicly and transparently.
          Source code, improvements and community contributions can be followed on GitHub.
        </p>
        <a
          class="footer-github-link"
          href="https://github.com/smitskecbs"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit CBS on GitHub"
        >
          <svg class="footer-github-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
              fill="currentColor"
            />
          </svg>
          <span>GitHub</span>
        </a>
        <p class="footer-badge-row">
          Open Source • Community Driven • Built on Solana
        </p>
      </section>
      <p class="site-footer-copy">Community-built tools for Solana builders.</p>
    </footer>
  </main>
`;var d=document.getElementById(`startBtn`),f=document.getElementById(`stopBtn`),p=document.getElementById(`status`),m=document.getElementById(`statusModal`),h=document.getElementById(`modalStatus`),g=document.getElementById(`modalStopBtn`),ee=document.getElementById(`closeModalBtn`),_=document.getElementById(`position`),v=document.getElementById(`workerCount`),y=document.getElementById(`engine`),b=document.getElementById(`ignoreCase`),x=document.getElementById(`patternFields`),S=document.getElementById(`recentWallets`),C=document.getElementById(`clearRecentBtn`),w=document.getElementById(`estimateBox`),T=document.getElementById(`advancedWarning`),E=document.getElementById(`toggleAdvancedBtn`),D=document.getElementById(`advancedOptions`);E?.addEventListener(`click`,()=>{D?.classList.toggle(`collapsed`),E.textContent=D?.classList.contains(`collapsed`)?`Show Advanced`:`Hide Advanced`});function O(e){p&&(p.innerHTML=e),h&&(h.innerHTML=e)}function k(e,t,n,r){e&&(e.querySelector(`#copyPublicBtn`)?.addEventListener(`click`,()=>{navigator.clipboard.writeText(t),alert(`Public key copied!`)}),e.querySelector(`#copyPrivateBtn`)?.addEventListener(`click`,()=>{navigator.clipboard.writeText(n),alert(`Private key copied!`)}),e.querySelector(`#downloadBtn`)?.addEventListener(`click`,()=>{ne(t,n)}),e.querySelector(`#downloadJsonBtn`)?.addEventListener(`click`,()=>{re(r,t)}))}function A(e,t,n){k(p,e,t,n),k(h,e,t,n)}function j(){m&&(m.classList.remove(`hidden`),setTimeout(()=>{m.classList.add(`open`)},20))}function M(){m&&(m.classList.remove(`open`),m.addEventListener(`transitionend`,()=>{m.classList.add(`hidden`)},{once:!0}))}g?.addEventListener(`click`,()=>{f?.click()}),ee?.addEventListener(`click`,()=>{M()});function N(e){let t=(e||``).toLowerCase();return t===`kit`||t===`solana-kit`||t===`solana kit`}function P(e){return N(e)?`Kit`:`web3.js`}function F(){let e=_.value;e===`prefix`&&(x.innerHTML=`
      <label>Start pattern</label>
      <input id="pattern" maxlength="5" placeholder="Example: CBS" />
    `),e===`suffix`&&(x.innerHTML=`
      <label>End pattern</label>
      <input id="pattern" maxlength="5" placeholder="Example: BONK" />
    `),e===`both`&&(x.innerHTML=`
      <label>Pattern</label>
      <input id="pattern" maxlength="5" placeholder="Example: SOL" />
    `),e===`bothEnds`&&(x.innerHTML=`
      <label>Start pattern</label>
      <input id="pattern" maxlength="5" placeholder="Example: CBS" />

      <label>End pattern</label>
      <input id="endPattern" maxlength="5" placeholder="Example: SOL" />
    `),e===`anywhere`&&(x.innerHTML=`
      <label>Pattern</label>
      <input id="pattern" maxlength="5" placeholder="Example: CBS" />
      <p>Anywhere in wallet: xxxCBSxxx</p>
    `),I()?.addEventListener(`input`,Q),L()?.addEventListener(`input`,Q),Q()}function I(){return document.getElementById(`pattern`)}function L(){return document.getElementById(`endPattern`)}function R(){return I()?.value.trim()||``}function z(){return L()?.value.trim()||``}function B(){n=!1,i.forEach(e=>e.terminate()),i=[]}function V(e){return s.some(t=>e.includes(t))}function H(e){return s.filter(t=>e.includes(t))}function U(){let e=(Date.now()-a)/1e3;if(e<=0)return 0;let t=Math.round(r/e);return t>0&&(o=t),t}function W(){let e=localStorage.getItem(c);if(!e)return[];try{return JSON.parse(e)}catch{return[]}}function G(e){let t=W();t.unshift(e),localStorage.setItem(c,JSON.stringify(t.slice(0,10))),K()}function K(){let e=W();if(e.length===0){S.innerHTML=`No recent wallets yet.`;return}S.innerHTML=e.map(e=>{let t=N(e.engine)?`Elapsed: ${(e.elapsed||0).toFixed(2)}s<br>`:`
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

          Engine: ${P(e.engine)}<br>
          ${t}
          Date: ${e.createdAt}

          <br><br>

          <button class="copyRecentBtn" data-public-key="${e.publicKey}">
            Copy Public Key
          </button>
        </div>
      `}).join(``),document.querySelectorAll(`.copyRecentBtn`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-public-key`);t&&(navigator.clipboard.writeText(t),alert(`Public key copied!`))})})}function q(e){return e<500?`Common`:e<1e4?`Uncommon`:e<5e5?`Rare`:e<2e7?`Epic`:e<2e9?`Legendary`:`Insane`}function J(e){return e===`Common`?`⚪`:e===`Uncommon`?`🟢`:e===`Rare`?`🔵`:e===`Epic`?`🟣`:e===`Legendary`?`🟡`:`🔥`}function Y(e){if(e<1)return`less than 1 second`;if(e<60)return Math.round(e)+` seconds`;let t=e/60;if(t<60)return Math.round(t)+` minutes`;let n=t/60;if(n<24)return Math.round(n*10)/10+` hours`;let r=n/24;if(r<365)return Math.round(r*10)/10+` days`;let i=r/365;return Math.round(i*10)/10+` years`}function X(e,t){if(!t)return 1;let n=1;for(let t of e){let e=t.toLowerCase(),r=t.toUpperCase(),i=!s.includes(e),a=!s.includes(r);e!==r&&i&&a&&(n*=2)}return n}function Z(){_.value===`bothEnds`?T.classList.remove(`hidden`):T.classList.add(`hidden`)}function Q(){let e=R(),t=z(),n=_.value,r=b.checked;if(Z(),!e){w.innerHTML=`Enter a pattern to see estimated difficulty.`;return}if(V(e)||V(t)){w.innerHTML=`
      <strong>Invalid pattern</strong><br>
      Not allowed: ${[...H(e),...H(t)].join(`, `)}
    `;return}if(n===`bothEnds`&&!t){w.innerHTML=`
      <strong>Start AND end mode</strong><br>
      Enter both a start pattern and an end pattern.<br><br>
      Example: start = CBS, end = SOL
    `;return}let i=e.length,a=X(e,r),s=1;n===`both`&&(s=2),n===`anywhere`&&(s=Math.max(1,l-e.length+1)),n===`bothEnds`&&(i=e.length+t.length,a=X(e,r)*X(t,r));let c=Math.round(58**i/a/s),u=c/(o>0?o:5e4),d=q(c);w.innerHTML=`
    <strong>Rarity:</strong> ${J(d)} ${d}<br>
    <strong>Average attempts:</strong> ${c.toLocaleString()}<br>
    <strong>Estimated average time:</strong> ${Y(u)}<br>
    <small>This is an average estimate. It can be found much faster or much slower.</small>
  `}function $(e){let t=U(),n=((Date.now()-a)/1e3).toFixed(1),i=y.value===`kit`;O(`
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
  `),Q()}function te(){let e=v.value,t=navigator.hardwareConcurrency||4;return e===`auto`?Math.max(1,Math.floor(t/2)):e===`max`?t:Number(e)}function ne(e,t){let n=`CBS Local Wallet Generator

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
`,r=new Blob([n],{type:`text/plain`}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=`wallet-`+e+`.txt`,a.click(),URL.revokeObjectURL(i)}function re(e,t){let n=Array.from(e),r=new Blob([JSON.stringify(n)],{type:`application/json`}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=`wallet-`+t+`.json`,a.click(),URL.revokeObjectURL(i)}_.addEventListener(`change`,()=>{F()}),b.addEventListener(`change`,Q),v.addEventListener(`change`,Q),y.addEventListener(`change`,Q),C?.addEventListener(`click`,()=>{localStorage.removeItem(c),K()}),f?.addEventListener(`click`,()=>{B(),O(`
    <div class="status-searching">
      Search stopped.
    </div>
  `)}),d?.addEventListener(`click`,()=>{let e=R(),t=z(),o=_.value,s=te(),c=b.checked;if(!e){O(`
      <div class="status-searching">
        Please enter a pattern.
      </div>
    `);return}if(o===`bothEnds`&&!t){O(`
      <div class="status-searching">
        Please enter an end pattern for Start AND end mode.
      </div>
    `);return}if(V(e)||V(t)){O(`
      <div class="status-searching">
        <strong>Invalid pattern</strong><br><br>
        These characters are not allowed in Solana Base58 addresses:<br><br>
        <strong>${[...H(e),...H(t)].join(`, `)}</strong><br><br>
        Please remove them and try again.
      </div>
    `);return}if(B(),n=!0,r=0,a=Date.now(),j(),y.value===`kit`){let e=setInterval(()=>{if(!n){clearInterval(e);return}$(s)},100)}$(s);for(let a=0;a<s;a++){let a;a=y.value===`kit`?new Worker(new URL(``+new URL(`kitWorker-nI_jW3qk.js`,import.meta.url).href,``+import.meta.url),{type:`module`}):new Worker(new URL(``+new URL(`walletWorker-D-e_X1Yr.js`,import.meta.url).href,``+import.meta.url),{type:`module`}),a.onmessage=i=>{if(n&&(i.data.type===`attempt`&&(r++,r%1e3==0&&$(s)),i.data.type!==`started`&&i.data.type===`found`)){let n=i.data.publicKey,a=i.data.privateKey,c=new Uint8Array(i.data.secretKey),l=i.data.engine||y.value,u=i.data.seconds||0;B();let d=U(),f=o===`bothEnds`?e+`...`+t:e,p=N(l);G({publicKey:n,pattern:f,position:o,engine:p?`Kit`:`web3.js`,attempts:p?void 0:r,speed:p?void 0:d,elapsed:p?u:void 0,createdAt:new Date().toLocaleString()}),O(`
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
        `),A(n,a,c)}},a.postMessage({pattern:e,endPattern:t,position:o,ignoreCase:c}),i.push(a)}}),K(),F(),ae(),ie();function ie(){let e=document.getElementById(`donationCopyBtn`),t=document.getElementById(`donationConfirm`);if(!e||!t)return;let n;e.addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(u),t.hidden=!1,t.textContent=`Address copied.`}catch{t.hidden=!1,t.textContent=`Copy failed. Select the wallet address above and copy manually.`}n!==void 0&&window.clearTimeout(n),n=window.setTimeout(()=>{t.hidden=!0,t.textContent=`Address copied.`},2400)})}function ae(){let e=document.querySelectorAll(`.reveal`);if(`IntersectionObserver`in window){let t=new IntersectionObserver(e=>{for(let n of e)n.isIntersecting&&(n.target.classList.add(`visible`),t.unobserve(n.target))},{threshold:.15});e.forEach(e=>t.observe(e))}else e.forEach(e=>e.classList.add(`visible`))}