(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function e(e,t){if(t)return 1;let n=new Set([`0`,`O`,`I`,`l`]),r=1;for(let t of e){let e=t.toLowerCase(),i=t.toUpperCase(),a=!n.has(e),o=!n.has(i);e!==i&&a&&o&&(r*=2)}return r}function t(t){let{pattern:n,endPattern:r=``,position:i,caseSensitive:a}=t;if(!n||i===`bothEnds`&&!r)return 0;let o=n.length,s=e(n,a),c=1;return i===`both`&&(c=2),i===`anywhere`&&(c=Math.max(1,44-n.length+1)),i===`bothEnds`&&(o=n.length+r.length,s=e(n,a)*e(r,a)),Math.max(1,Math.round(58**o/s/c))}function n(e){return e<1e4?`Easy`:e<5e5?`Moderate`:e<2e7?`Hard`:e<2e9?`Very hard`:`Extreme`}function r(e){if(!Number.isFinite(e)||e<0)return`unknown`;if(e<1)return`less than 1 second`;if(e<60)return`${Math.round(e)} seconds`;let t=e/60;if(t<60)return`${Math.round(t)} minutes`;let n=t/60;if(n<24)return`${Math.round(n*10)/10} hours`;let r=n/24;if(r<365)return`${Math.round(r*10)/10} days`;let i=r/365;return`${Math.round(i*10)/10} years`}function i(e){let r=t(e),i=n(r),a=e.measuredSpeed;return{expectedAttempts:r,label:i,estimatedSeconds:a&&a>0?r/a:null}}var a=`modulepreload`,o=function(e,t){return new URL(e,t).href},s={},c=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),c=i?.nonce||i?.getAttribute(`nonce`);function l(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=l(t.map(t=>{if(t=o(t,n),t in s)return;s[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let l=document.createElement(`link`);if(l.rel=r?`stylesheet`:a,r||(l.as=`script`),l.crossOrigin=``,l.href=t,c&&l.setAttribute(`nonce`,c),document.head.appendChild(l),r)return new Promise((e,n)=>{l.addEventListener(`load`,e),l.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},l=!1;async function u(){try{return await crypto.subtle.generateKey({name:`Ed25519`},!1,[`sign`,`verify`]),!0}catch{return!1}}async function d(){if(typeof crypto>`u`||!crypto.subtle)return{ok:!1,reason:`This browser does not provide Web Crypto. Address generation cannot run safely here.`};if(await u())return{ok:!0,native:!0,polyfilled:!1};try{if(!l){let{install:e}=await c(async()=>{let{install:e}=await import(`./index.browser-DzdbziX3.js`);return{install:e}},[],import.meta.url);e(),l=!0}}catch{return{ok:!1,reason:`Ed25519 is not supported in this browser and the compatibility polyfill could not be loaded.`}}return await u()?{ok:!0,native:!1,polyfilled:!0}:{ok:!1,reason:`Ed25519 key generation is not available in this browser. Please update Chrome, Firefox, Edge, or Safari and try again.`}}function f(e){if(e.length>=255)throw TypeError(`Alphabet too long`);let t=new Uint8Array(256);for(let e=0;e<t.length;e++)t[e]=255;for(let n=0;n<e.length;n++){let r=e.charAt(n),i=r.charCodeAt(0);if(t[i]!==255)throw TypeError(r+` is ambiguous`);t[i]=n}let n=e.length,r=e.charAt(0),i=Math.log(n)/Math.log(256),a=Math.log(256)/Math.log(n);function o(t){if(t instanceof Uint8Array||(ArrayBuffer.isView(t)?t=new Uint8Array(t.buffer,t.byteOffset,t.byteLength):Array.isArray(t)&&(t=Uint8Array.from(t))),!(t instanceof Uint8Array))throw TypeError(`Expected Uint8Array`);if(t.length===0)return``;let i=0,o=0,s=0,c=t.length;for(;s!==c&&t[s]===0;)s++,i++;let l=(c-s)*a+1>>>0,u=new Uint8Array(l);for(;s!==c;){let e=t[s],r=0;for(let t=l-1;(e!==0||r<o)&&t!==-1;t--,r++)e+=256*u[t]>>>0,u[t]=e%n>>>0,e=e/n>>>0;if(e!==0)throw Error(`Non-zero carry`);o=r,s++}let d=l-o;for(;d!==l&&u[d]===0;)d++;let f=r.repeat(i);for(;d<l;++d)f+=e.charAt(u[d]);return f}function s(e){if(typeof e!=`string`)throw TypeError(`Expected String`);if(e.length===0)return new Uint8Array;let a=0,o=0,s=0;for(;e[a]===r;)o++,a++;let c=(e.length-a)*i+1>>>0,l=new Uint8Array(c);for(;a<e.length;){let r=e.charCodeAt(a);if(r>255)return;let i=t[r];if(i===255)return;let o=0;for(let e=c-1;(i!==0||o<s)&&e!==-1;e--,o++)i+=n*l[e]>>>0,l[e]=i%256>>>0,i=i/256>>>0;if(i!==0)throw Error(`Non-zero carry`);s=o,a++}let u=c-s;for(;u!==c&&l[u]===0;)u++;let d=new Uint8Array(o+(c-u)),f=o;for(;u!==c;)d[f++]=l[u++];return d}function c(e){let t=s(e);if(t)return t;throw Error(`Non-base`+n+` character`)}return{encode:o,decodeUnsafe:s,decode:c}}f(`123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`);function p(e,t,n=new Date){let r=n.toLocaleString();return`SOLANA ADDRESS BACKUP
=====================

Public Address:
`+e+`

Private Key:
`+t+`

Created:
`+r+`

IMPORTANT
---------
This private key gives full control of this wallet.

Anyone with this private key can control the wallet and its funds.

Never share this file or private key with anyone.

RECOMMENDED STORAGE
-------------------
- Store this backup offline.
- An encrypted USB drive is one practical option.
- Consider keeping a second secure offline backup if the wallet will hold valuable assets.
- Avoid cloud storage, email, chat messages and screenshots.
- After verifying your backup, remove unnecessary copies from this computer.

VERIFY YOUR BACKUP
------------------
After importing the private key into a compatible Solana wallet, verify that the wallet shows this exact public address:

`+e+`
`}function ee(e){return`solana-address-backup-${e.replace(/[^1-9A-HJ-NP-Za-km-z]/g,``).slice(0,12)||`address`}.txt`}function te(e,t){let n=new Blob([t],{type:`text/plain;charset=utf-8`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=e,i.click(),URL.revokeObjectURL(r)}function ne(e){e.secretKey&&e.secretKey.fill(0),typeof e.privateKey==`string`&&(e.privateKey=``)}function m(e){return new Promise(t=>{let n=document.activeElement instanceof HTMLElement?document.activeElement:null,r=document.createElement(`div`);r.className=`confirm-overlay`,r.setAttribute(`role`,`presentation`);let i=document.createElement(`div`);i.className=`confirm-dialog`,i.setAttribute(`role`,`alertdialog`),i.setAttribute(`aria-modal`,`true`),i.setAttribute(`aria-labelledby`,`confirmDialogTitle`),i.setAttribute(`aria-describedby`,`confirmDialogBody`);let a=document.createElement(`h2`);a.id=`confirmDialogTitle`,a.className=`confirm-dialog-title`,a.textContent=e.title;let o=document.createElement(`div`);o.id=`confirmDialogBody`,o.className=`confirm-dialog-body`;for(let t of e.paragraphs){let e=document.createElement(`p`);e.textContent=t,o.appendChild(e)}let s=document.createElement(`div`);s.className=`confirm-dialog-actions`;let c=document.createElement(`button`);c.type=`button`,c.className=`tertiary-btn`,c.textContent=e.cancelLabel??`Cancel`;let l=document.createElement(`button`);l.type=`button`,l.className=e.dangerConfirm?`danger-btn`:`primary-btn`,l.textContent=e.confirmLabel,s.append(c,l),i.append(a,o,s),r.appendChild(i),document.body.appendChild(r);let u=[c,l],d=!1,f=e=>{d||(d=!0,document.removeEventListener(`keydown`,p,!0),r.remove(),n?.focus(),t(e))},p=e=>{if(e.key===`Escape`){e.preventDefault(),f(!1);return}if(e.key!==`Tab`)return;let t=u[0],n=u[u.length-1];e.shiftKey&&document.activeElement===t?(e.preventDefault(),n.focus()):!e.shiftKey&&document.activeElement===n&&(e.preventDefault(),t.focus())};c.addEventListener(`click`,()=>f(!1)),l.addEventListener(`click`,()=>f(!0)),r.addEventListener(`click`,e=>{e.target===r&&f(!1)}),document.addEventListener(`keydown`,p,!0),c.focus()})}var h=(e=>(e[e.Border=-1]=`Border`,e[e.Data=0]=`Data`,e[e.Function=1]=`Function`,e[e.Position=2]=`Position`,e[e.Timing=3]=`Timing`,e[e.Alignment=4]=`Alignment`,e))(h||{}),re=[0,1],ie=[1,0],ae=[2,3],oe=[3,2],se={L:re,M:ie,Q:ae,H:oe},ce=/^\d*$/,le=/^[A-Z0-9 $%*+./:-]*$/,g=`0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:`,_=1,v=40,ue=3,de=3,y=40,fe=10,pe=[[-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],[-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],[-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],[-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]],me=[[-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],[-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],[-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],[-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81]],he=class{constructor(e,t,n,r){if(this.version=e,this.ecc=t,e<_||e>v)throw RangeError(`Version value out of range`);if(r<-1||r>7)throw RangeError(`Mask value out of range`);this.size=e*4+17;let i=Array.from({length:this.size}).fill(!1);for(let e=0;e<this.size;e++)this.modules.push(i.slice()),this.types.push(i.map(()=>0));this.drawFunctionPatterns();let a=this.addEccAndInterleave(n);if(this.drawCodewords(a),r===-1){let e=1e9;for(let t=0;t<8;t++){this.applyMask(t),this.drawFormatBits(t);let n=this.getPenaltyScore();n<e&&(r=t,e=n),this.applyMask(t)}}this.mask=r,this.applyMask(r),this.drawFormatBits(r)}size;mask;modules=[];types=[];getModule(e,t){return e>=0&&e<this.size&&t>=0&&t<this.size&&this.modules[t][e]}drawFunctionPatterns(){for(let e=0;e<this.size;e++)this.setFunctionModule(6,e,e%2==0,h.Timing),this.setFunctionModule(e,6,e%2==0,h.Timing);this.drawFinderPattern(3,3),this.drawFinderPattern(this.size-4,3),this.drawFinderPattern(3,this.size-4);let e=this.getAlignmentPatternPositions(),t=e.length;for(let n=0;n<t;n++)for(let r=0;r<t;r++)n===0&&r===0||n===0&&r===t-1||n===t-1&&r===0||this.drawAlignmentPattern(e[n],e[r]);this.drawFormatBits(0),this.drawVersion()}drawFormatBits(e){let t=this.ecc[1]<<3|e,n=t;for(let e=0;e<10;e++)n=n<<1^(n>>>9)*1335;let r=(t<<10|n)^21522;for(let e=0;e<=5;e++)this.setFunctionModule(8,e,x(r,e));this.setFunctionModule(8,7,x(r,6)),this.setFunctionModule(8,8,x(r,7)),this.setFunctionModule(7,8,x(r,8));for(let e=9;e<15;e++)this.setFunctionModule(14-e,8,x(r,e));for(let e=0;e<8;e++)this.setFunctionModule(this.size-1-e,8,x(r,e));for(let e=8;e<15;e++)this.setFunctionModule(8,this.size-15+e,x(r,e));this.setFunctionModule(8,this.size-8,!0)}drawVersion(){if(this.version<7)return;let e=this.version;for(let t=0;t<12;t++)e=e<<1^(e>>>11)*7973;let t=this.version<<12|e;for(let e=0;e<18;e++){let n=x(t,e),r=this.size-11+e%3,i=Math.floor(e/3);this.setFunctionModule(r,i,n),this.setFunctionModule(i,r,n)}}drawFinderPattern(e,t){for(let n=-4;n<=4;n++)for(let r=-4;r<=4;r++){let i=Math.max(Math.abs(r),Math.abs(n)),a=e+r,o=t+n;a>=0&&a<this.size&&o>=0&&o<this.size&&this.setFunctionModule(a,o,i!==2&&i!==4,h.Position)}}drawAlignmentPattern(e,t){for(let n=-2;n<=2;n++)for(let r=-2;r<=2;r++)this.setFunctionModule(e+r,t+n,Math.max(Math.abs(r),Math.abs(n))!==1,h.Alignment)}setFunctionModule(e,t,n,r=h.Function){this.modules[t][e]=n,this.types[t][e]=r}addEccAndInterleave(e){let t=this.version,n=this.ecc;if(e.length!==w(t,n))throw RangeError(`Invalid argument`);let r=me[n[0]][t],i=pe[n[0]][t],a=Math.floor(C(t)/8),o=r-a%r,s=Math.floor(a/r),c=[],l=Oe(i);for(let t=0,n=0;t<r;t++){let r=e.slice(n,n+s-i+(t<o?0:1));n+=r.length;let a=ke(r,l);t<o&&r.push(0),c.push(r.concat(a))}let u=[];for(let e=0;e<c[0].length;e++)c.forEach((t,n)=>{(e!==s-i||n>=o)&&u.push(t[e])});return u}drawCodewords(e){if(e.length!==Math.floor(C(this.version)/8))throw RangeError(`Invalid argument`);let t=0;for(let n=this.size-1;n>=1;n-=2){n===6&&(n=5);for(let r=0;r<this.size;r++)for(let i=0;i<2;i++){let a=n-i,o=n+1&2?r:this.size-1-r;!this.types[o][a]&&t<e.length*8&&(this.modules[o][a]=x(e[t>>>3],7-(t&7)),t++)}}}applyMask(e){if(e<0||e>7)throw RangeError(`Mask value out of range`);for(let t=0;t<this.size;t++)for(let n=0;n<this.size;n++){let r;switch(e){case 0:r=(n+t)%2==0;break;case 1:r=t%2==0;break;case 2:r=n%3==0;break;case 3:r=(n+t)%3==0;break;case 4:r=(Math.floor(n/3)+Math.floor(t/2))%2==0;break;case 5:r=n*t%2+n*t%3==0;break;case 6:r=(n*t%2+n*t%3)%2==0;break;case 7:r=((n+t)%2+n*t%3)%2==0;break;default:throw Error(`Unreachable`)}!this.types[t][n]&&r&&(this.modules[t][n]=!this.modules[t][n])}}getPenaltyScore(){let e=0;for(let t=0;t<this.size;t++){let n=!1,r=0,i=[0,0,0,0,0,0,0];for(let a=0;a<this.size;a++)this.modules[t][a]===n?(r++,r===5?e+=ue:r>5&&e++):(this.finderPenaltyAddHistory(r,i),n||(e+=this.finderPenaltyCountPatterns(i)*y),n=this.modules[t][a],r=1);e+=this.finderPenaltyTerminateAndCount(n,r,i)*y}for(let t=0;t<this.size;t++){let n=!1,r=0,i=[0,0,0,0,0,0,0];for(let a=0;a<this.size;a++)this.modules[a][t]===n?(r++,r===5?e+=ue:r>5&&e++):(this.finderPenaltyAddHistory(r,i),n||(e+=this.finderPenaltyCountPatterns(i)*y),n=this.modules[a][t],r=1);e+=this.finderPenaltyTerminateAndCount(n,r,i)*y}for(let t=0;t<this.size-1;t++)for(let n=0;n<this.size-1;n++){let r=this.modules[t][n];r===this.modules[t][n+1]&&r===this.modules[t+1][n]&&r===this.modules[t+1][n+1]&&(e+=de)}let t=0;for(let e of this.modules)t=e.reduce((e,t)=>e+ +!!t,t);let n=this.size*this.size,r=Math.ceil(Math.abs(t*20-n*10)/n)-1;return e+=r*fe,e}getAlignmentPatternPositions(){if(this.version===1)return[];{let e=Math.floor(this.version/7)+2,t=this.version===32?26:Math.ceil((this.version*4+4)/(e*2-2))*2,n=[6];for(let r=this.size-7;n.length<e;r-=t)n.splice(1,0,r);return n}}finderPenaltyCountPatterns(e){let t=e[1],n=t>0&&e[2]===t&&e[3]===t*3&&e[4]===t&&e[5]===t;return(n&&e[0]>=t*4&&e[6]>=t?1:0)+(n&&e[6]>=t*4&&e[0]>=t?1:0)}finderPenaltyTerminateAndCount(e,t,n){return e&&(this.finderPenaltyAddHistory(t,n),t=0),t+=this.size,this.finderPenaltyAddHistory(t,n),this.finderPenaltyCountPatterns(n)}finderPenaltyAddHistory(e,t){t[0]===0&&(e+=this.size),t.pop(),t.unshift(e)}};function b(e,t,n){if(t<0||t>31||e>>>t)throw RangeError(`Value out of range`);for(let r=t-1;r>=0;r--)n.push(e>>>r&1)}function x(e,t){return(e>>>t&1)!=0}var S=class{constructor(e,t,n){if(this.mode=e,this.numChars=t,this.bitData=n,t<0)throw RangeError(`Invalid argument`);this.bitData=n.slice()}getData(){return this.bitData.slice()}},ge=[1,10,12,14],_e=[2,9,11,13],ve=[4,8,16,16];function ye(e,t){return e[Math.floor((t+7)/17)+1]}function be(e){let t=[];for(let n of e)b(n,8,t);return new S(ve,e.length,t)}function xe(e){if(!we(e))throw RangeError(`String contains non-numeric characters`);let t=[];for(let n=0;n<e.length;){let r=Math.min(e.length-n,3);b(Number.parseInt(e.substring(n,n+r),10),r*3+1,t),n+=r}return new S(ge,e.length,t)}function Se(e){if(!Te(e))throw RangeError(`String contains unencodable characters in alphanumeric mode`);let t=[],n;for(n=0;n+2<=e.length;n+=2){let r=g.indexOf(e.charAt(n))*45;r+=g.indexOf(e.charAt(n+1)),b(r,11,t)}return n<e.length&&b(g.indexOf(e.charAt(n)),6,t),new S(_e,e.length,t)}function Ce(e){return e===``?[]:we(e)?[xe(e)]:Te(e)?[Se(e)]:[be(De(e))]}function we(e){return ce.test(e)}function Te(e){return le.test(e)}function Ee(e,t){let n=0;for(let r of e){let e=ye(r.mode,t);if(r.numChars>=1<<e)return 1/0;n+=4+e+r.bitData.length}return n}function De(e){e=encodeURI(e);let t=[];for(let n=0;n<e.length;n++)e.charAt(n)===`%`?(t.push(Number.parseInt(e.substring(n+1,n+3),16)),n+=2):t.push(e.charCodeAt(n));return t}function C(e){if(e<_||e>v)throw RangeError(`Version number out of range`);let t=(16*e+128)*e+64;if(e>=2){let n=Math.floor(e/7)+2;t-=(25*n-10)*n-55,e>=7&&(t-=36)}return t}function w(e,t){return Math.floor(C(e)/8)-pe[t[0]][e]*me[t[0]][e]}function Oe(e){if(e<1||e>255)throw RangeError(`Degree out of range`);let t=[];for(let n=0;n<e-1;n++)t.push(0);t.push(1);let n=1;for(let r=0;r<e;r++){for(let e=0;e<t.length;e++)t[e]=T(t[e],n),e+1<t.length&&(t[e]^=t[e+1]);n=T(n,2)}return t}function ke(e,t){let n=t.map(e=>0);for(let r of e){let e=r^n.shift();n.push(0),t.forEach((t,r)=>n[r]^=T(t,e))}return n}function T(e,t){if(e>>>8||t>>>8)throw RangeError(`Byte out of range`);let n=0;for(let r=7;r>=0;r--)n=n<<1^(n>>>7)*285,n^=(t>>>r&1)*e;return n}function Ae(e,t,n=1,r=40,i=-1,a=!0){if(!(_<=n&&n<=r&&r<=v)||i<-1||i>7)throw RangeError(`Invalid value`);let o,s;for(o=n;;o++){let n=w(o,t)*8,i=Ee(e,o);if(i<=n){s=i;break}if(o>=r)throw RangeError(`Data too long`)}for(let e of[ie,ae,oe])a&&s<=w(o,e)*8&&(t=e);let c=[];for(let t of e){b(t.mode[0],4,c),b(t.numChars,ye(t.mode,o),c);for(let e of t.getData())c.push(e)}let l=w(o,t)*8;b(0,Math.min(4,l-c.length),c),b(0,(8-c.length%8)%8,c);for(let e=236;c.length<l;e^=253)b(e,8,c);let u=Array.from({length:Math.ceil(c.length/8)},()=>0);return c.forEach((e,t)=>u[t>>>3]|=e<<7-(t&7)),new he(o,t,u,i)}function je(e,t){let{ecc:n=`L`,boostEcc:r=!1,minVersion:i=1,maxVersion:a=40,maskPattern:o=-1,border:s=1}=t||{},c=typeof e==`string`?Ce(e):Array.isArray(e)?[be(e)]:void 0;if(!c)throw Error(`uqr only supports encoding string and binary data, but got: ${typeof e}`);let l=Ae(c,se[n],i,a,o,r),u=Me({version:l.version,maskPattern:l.mask,size:l.size,data:l.modules,types:l.types},s);return t?.invert&&(u.data=u.data.map(e=>e.map(e=>!e))),t?.onEncoded?.(u),u}function Me(e,t=1){if(!t)return e;let{size:n}=e,r=n+t*2;e.size=r,e.data.forEach(e=>{for(let n=0;n<t;n++)e.unshift(!1),e.push(!1)});for(let n=0;n<t;n++)e.data.unshift(Array.from({length:r},e=>!1)),e.data.push(Array.from({length:r},e=>!1));let i=h.Border;e.types.forEach(e=>{for(let n=0;n<t;n++)e.unshift(i),e.push(i)});for(let n=0;n<t;n++)e.types.unshift(Array.from({length:r},e=>i)),e.types.push(Array.from({length:r},e=>i));return e}function Ne(e){return e.replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}function Pe(e,t={}){let n=je(e,t),{pixelSize:r=10,whiteColor:i=`white`,blackColor:a=`black`}=t,o=n.size*r,s=n.size*r,c=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${o}">`,l=[];for(let e=0;e<n.size;e++)for(let t=0;t<n.size;t++){let i=t*r,a=e*r;n.data[e][t]&&l.push(`M${i},${a}h${r}v${r}h-${r}z`)}return c+=`<rect fill="${Ne(i)}" width="${s}" height="${o}"/>`,c+=`<path fill="${Ne(a)}" d="${l.join(``)}"/>`,c+=`</svg>`,c}function Fe(e){if(!e||typeof e!=`string`)throw Error(`Private key payload is required.`);return e}function Ie(e){return Pe(Fe(e),{ecc:`M`,border:2,pixelSize:4,blackColor:`#041018`,whiteColor:`#ffffff`})}function Le(e){return e?e===`confirmed`?`found-backed-up`:`found-unsecured`:`cleared`}function E(e){return e===`unsecured`||e===`downloaded`}function Re(e){return e===`confirmed`?`confirmed`:`downloaded`}function ze(){return`confirmed`}var Be=/^[1-9A-HJ-NP-Za-km-z]*$/;function Ve(e){let t=[];for(let n of e)!Be.test(n)&&!t.includes(n)&&t.push(n);return t}function He(e){return e.length>5?`Maximum 5 characters.`:Ve(e).length>0?`This character is not available in a Solana address. Base58 does not use 0, O, I or l.`:null}function Ue(e,t,n){return e?n===`bothEnds`&&!t?{ok:!1,message:`Start AND end mode needs both a start pattern and an end pattern.`}:e.length>5||t.length>5?{ok:!1,message:`Maximum 5 characters.`}:[...Ve(e),...Ve(t)].length>0?{ok:!1,message:`This character is not available in a Solana address. Base58 does not use 0, O, I or l.`}:{ok:!0}:{ok:!1,message:`Please enter a search pattern.`}}var D=`cbs-recent-wallets`,We=[`privateKey`,`secretKey`,`seed`,`seedPhrase`,`mnemonic`,`pkcs8`,`secret`,`rawSecret`,`private`];function Ge(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function Ke(e){if(!Ge(e))return null;let t=e.publicKey;return typeof t!=`string`||!t?null:{publicKey:t,pattern:typeof e.pattern==`string`?e.pattern:``,position:typeof e.position==`string`?e.position:``,createdAt:typeof e.createdAt==`string`?e.createdAt:new Date().toLocaleString()}}function qe(e){if(!e)return{wallets:[],removedSecretFields:!1};let t;try{t=JSON.parse(e)}catch{return{wallets:[],removedSecretFields:!1}}if(!Array.isArray(t))return{wallets:[],removedSecretFields:!1};let n=!1,r=[];for(let e of t){if(Ge(e))for(let t of We)t in e&&e[t]!=null&&e[t]!==``&&(n=!0);let t=Ke(e);t&&r.push(t)}return{wallets:r.slice(0,10),removedSecretFields:n}}function O(e=localStorage){let{wallets:t,removedSecretFields:n}=qe(e.getItem(D));return(n||t.length>=0)&&e.setItem(D,JSON.stringify(t)),t}function Je(e,t=localStorage){let n=Ke(e);if(!n)return O(t);let r=[n,...O(t).filter(e=>e.publicKey!==n.publicKey)].slice(0,10);return t.setItem(D,JSON.stringify(r)),r}function Ye(e=localStorage){e.removeItem(D)}var Xe=class{workers=[];attempts=0;startTime=0;lifecycle=`idle`;activeSearchId=0;nextSearchId=1;winnerAccepted=!1;uiTimer=null;callbacks;lastWorkerCount=0;constructor(e){this.callbacks=e}get isSearching(){return this.lifecycle===`searching`}get currentLifecycle(){return this.lifecycle}get currentSearchId(){return this.activeSearchId}getAttemptCount(){return this.attempts}getElapsedMs(){return this.startTime?Date.now()-this.startTime:0}getSpeed(){let e=this.getElapsedMs()/1e3;return e<=0?0:Math.round(this.attempts/e)}get hasAcceptedWinner(){return this.winnerAccepted}getActiveWorkerCountForTests(){return this.workers.length}start(e){this.stop({silent:!0});let t=this.nextSearchId++;this.activeSearchId=t,this.lifecycle=`searching`,this.winnerAccepted=!1,this.attempts=0,this.startTime=Date.now(),this.lastWorkerCount=e.plan.workers;let n=e.plan.workers,r=e.progressEvery??1e3;for(let i=0;i<n;i++){let n=new Worker(new URL(``+new URL(`kitWorker-CtlEtlWa.js`,import.meta.url).href,``+import.meta.url),{type:`module`});n.onmessage=e=>{this.handleWorkerMessage(e.data)},n.onerror=e=>{e.preventDefault(),!(this.activeSearchId!==t||this.lifecycle!==`searching`)&&(this.callbacks.onError(`A generation worker crashed. Please try again or lower Performance settings.`,t),this.stop({silent:!0}),this.lifecycle=`error`)};let i={type:`start`,searchId:t,pattern:e.match.pattern,endPattern:e.match.endPattern||``,position:e.match.position,caseSensitive:e.match.caseSensitive,batchConcurrency:e.plan.batchConcurrency,progressEvery:r,needsPolyfill:e.needsPolyfill};n.postMessage(i),this.workers.push(n)}return this.uiTimer=window.setInterval(()=>{this.lifecycle!==`searching`||this.activeSearchId!==t||this.callbacks.onProgress({searchId:t,attempts:this.attempts,elapsedMs:this.getElapsedMs(),speed:this.getSpeed(),workers:n})},150),t}beginForTests(e=1){this.activeSearchId=e,this.nextSearchId=e+1,this.lifecycle=`searching`,this.winnerAccepted=!1,this.attempts=0,this.startTime=Date.now()}handleWorkerMessageForTests(e){this.handleWorkerMessage(e)}isActiveSearch(e){return e===this.activeSearchId&&(this.lifecycle===`searching`||this.lifecycle===`stopping`)}handleWorkerMessage(e){if(!(!(`searchId`in e)||!this.isActiveSearch(e.searchId))&&this.lifecycle!==`stopping`){if(e.type===`progress`){if(this.lifecycle!==`searching`)return;this.attempts+=e.attempts;return}if(e.type===`error`){if(this.winnerAccepted||this.lifecycle!==`searching`)return;this.lifecycle=`error`,this.callbacks.onError(e.message,e.searchId),this.stop({silent:!0});return}if(e.type===`found`){if(this.winnerAccepted||this.lifecycle!==`searching`)return;this.winnerAccepted=!0,this.lifecycle=`found`;let t={publicKey:e.publicKey,privateKey:e.privateKey,secretKey:new Uint8Array(e.secretKey)};this.stop({silent:!0}),this.callbacks.onFound(t,e.searchId);return}if(e.type===`ready`){if(this.lifecycle!==`searching`)return;this.callbacks.onProgress({searchId:e.searchId,attempts:this.attempts,elapsedMs:this.getElapsedMs(),speed:this.getSpeed(),workers:this.lastWorkerCount})}}}stop(e){let t=this.activeSearchId,n=this.lifecycle===`searching`;n&&(this.lifecycle=`stopping`),this.uiTimer!=null&&(window.clearInterval(this.uiTimer),this.uiTimer=null);let r=this.workers;this.workers=[];for(let e of r){try{e.postMessage({type:`cancel`,searchId:t})}catch{}try{e.terminate()}catch{}}if(n&&!e?.silent&&!this.winnerAccepted){this.lifecycle=`stopped`,this.callbacks.onStopped(t);return}this.lifecycle===`stopping`&&(this.lifecycle=this.winnerAccepted?`found`:`idle`)}};function Ze(e){let t=Math.floor(e/1e3),n=Math.floor(t/60),r=t%60;return`${String(n).padStart(2,`0`)}:${String(r).padStart(2,`0`)}`}function k(e,t,n){return n===`bothEnds`?`${e}…${t}`:e}function A(e=typeof navigator<`u`?navigator.userAgent:``){return/Mobi|Android|iPhone|iPad|iPod/i.test(e)}function j(e){let t=Math.max(1,e.hardwareConcurrency??(typeof navigator<`u`&&navigator.hardwareConcurrency||4)),n=e.isMobile??A(),r=e.preset;return r===`low`?{workers:1,batchConcurrency:1,preset:r,hardwareConcurrency:t,isMobile:n}:r===`maximum`?n?{workers:Math.max(1,Math.min(4,t)),batchConcurrency:1,preset:r,hardwareConcurrency:t,isMobile:n}:{workers:Math.max(1,t-2),batchConcurrency:2,preset:r,hardwareConcurrency:t,isMobile:n}:n?{workers:Math.max(1,Math.min(2,Math.floor(t/2))),batchConcurrency:1,preset:r,hardwareConcurrency:t,isMobile:n}:{workers:Math.max(1,Math.min(8,Math.floor(t/2))),batchConcurrency:1,preset:r,hardwareConcurrency:t,isMobile:n}}var Qe=document.querySelector(`#app`);if(!Qe)throw Error(`App element not found`);var $e=`ManGofryUWC5VWk7t4ATP32qJtGVBBNoVi2AQ9HyR9J`,M=`idle`,N=0,P=!1,F=null,I=!1,L={positionPrimary:`prefix`,positionAdvanced:``,pattern:``,endPattern:``,caseSensitive:!1,performance:`auto`,advancedOpen:!1},R=null,z=!1,B=!1;function et(e){!F||!E(F.backupStatus)||(e.preventDefault(),e.returnValue=``)}function V(){let e=!!F&&E(F.backupStatus);if(e&&!B){window.addEventListener(`beforeunload`,et),B=!0;return}!e&&B&&(window.removeEventListener(`beforeunload`,et),B=!1)}var H=new Xe({onProgress:e=>{e.speed>0&&(N=e.speed),it(e)},onFound:(e,t)=>{R&&t!==R.searchId||(F&&ne(F),F={...e,revealed:!1,qrVisible:!1,backupStatus:`unsecured`},V(),R&&(Je({publicKey:e.publicKey,pattern:k(R.pattern,R.endPattern,R.position),position:R.position,createdAt:new Date().toLocaleString()}),Tt()),G(`found`),ot())},onError:(e,t)=>{R&&t!==R.searchId||(G(`error`),Q(e))},onStopped:e=>{R&&e!==R.searchId||(G(`stopped`),at())}});function U(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function tt(){F&&(Z(),ne(F),F=null,V())}function W(e){return e.toLocaleString(`en-US`)}function G(e){M=e,document.querySelector(`#generatorCard`)?.setAttribute(`data-mode`,e),e!==`searching`&&(z=!1)}function K(){let e=document.querySelector(`input[name="positionPrimary"]:checked`)?.value||L.positionPrimary,t=document.querySelector(`input[name="positionAdvanced"]:checked`)?.value??L.positionAdvanced,n=document.querySelector(`#performance`)?.value||L.performance;return{positionPrimary:e===`suffix`||e===`anywhere`?e:`prefix`,positionAdvanced:t===`both`||t===`bothEnds`?t:``,pattern:document.querySelector(`#pattern`)?.value.trim()||L.pattern,endPattern:document.querySelector(`#endPattern`)?.value.trim()||L.endPattern,caseSensitive:document.querySelector(`#caseSensitive`)?.checked??L.caseSensitive,performance:n===`low`||n===`balanced`||n===`maximum`||n===`auto`?n:`auto`,advancedOpen:document.querySelector(`details.advanced-block`)?.open??L.advancedOpen}}function q(e){return e.positionAdvanced===`both`||e.positionAdvanced===`bothEnds`?e.positionAdvanced:e.positionPrimary}function J(){let e=document.querySelector(`#difficultyPanel`);if(!e)return;let t=K();L=t;let n=q(t);if(!t.pattern){e.innerHTML=`<div class="difficulty-label muted">Enter text to see difficulty.</div>`;return}let a=Ue(t.pattern,t.endPattern,n);if(!a.ok){e.innerHTML=`<div class="difficulty-label danger">${U(a.message)}</div>`;return}let o=i({pattern:t.pattern,endPattern:t.endPattern,position:n,caseSensitive:t.caseSensitive,measuredSpeed:N>0?N:null}),s=o.estimatedSeconds==null?``:` · ETA ~${r(o.estimatedSeconds)}`;e.innerHTML=`
    <div class="difficulty-row">
      <span class="difficulty-kicker">How hard is this address to find?</span>
      <span class="difficulty-label">${U(o.label)}</span>
      <span class="difficulty-meta">~${W(o.expectedAttempts)} attempts${U(s)}</span>
    </div>
    <details class="help-details">
      <summary>What does this mean?</summary>
      <p class="field-hint">
        Longer patterns take much longer on average. Estimates use the Base58 alphabet and your recent speed.
        Vanity search is probabilistic — a match can appear much sooner or later than the ETA.
      </p>
    </details>
  `}function Y(){let e=document.querySelector(`#patternFields`);if(!e)return;let t=q(L),n=`Type your text…`,r=`Maximum 5 characters · Base58 only`;t===`bothEnds`?e.innerHTML=`
      <label for="pattern">Starts with</label>
      <input id="pattern" autocomplete="off" spellcheck="false" placeholder="${n}" value="${U(L.pattern)}" />
      <p class="field-rule">${r}</p>
      <p class="field-feedback" id="patternFeedback" hidden aria-live="polite"></p>
      <label for="endPattern">Ends with</label>
      <input id="endPattern" autocomplete="off" spellcheck="false" placeholder="${n}" value="${U(L.endPattern)}" />
      <p class="field-rule">${r}</p>
      <p class="field-feedback" id="endPatternFeedback" hidden aria-live="polite"></p>
    `:e.innerHTML=`
      <label for="pattern">Custom text</label>
      <input id="pattern" autocomplete="off" spellcheck="false" placeholder="${n}" value="${U(L.pattern)}" />
      <p class="field-rule">${r}</p>
      <p class="field-feedback" id="patternFeedback" hidden aria-live="polite"></p>
    `,nt(`pattern`,`patternFeedback`),nt(`endPattern`,`endPatternFeedback`),J()}function nt(e,t){let n=document.querySelector(`#${e}`);if(!n)return;let r=()=>{let e=document.querySelector(`#${t}`),r=He(n.value);e&&(r?(e.hidden=!1,e.textContent=r,n.classList.add(`input-invalid`)):(e.hidden=!0,e.textContent=``,n.classList.remove(`input-invalid`))),L=K(),J()};n.addEventListener(`beforeinput`,e=>{let r=e;if(!r.isComposing&&r.inputType===`insertText`&&typeof r.data==`string`&&(n.value.slice(0,n.selectionStart??n.value.length)+r.data+n.value.slice(n.selectionEnd??n.value.length)).length>5){r.preventDefault();let e=document.querySelector(`#${t}`);e&&(e.hidden=!1,e.textContent=`Maximum 5 characters.`),n.classList.add(`input-invalid`)}}),n.addEventListener(`paste`,e=>{e.preventDefault();let i=e.clipboardData?.getData(`text`)??``,a=n.selectionStart??0,o=n.selectionEnd??0;if((n.value.slice(0,a)+i+n.value.slice(o)).length>5){let e=document.querySelector(`#${t}`);e&&(e.hidden=!1,e.textContent=`Maximum 5 characters.`),n.classList.add(`input-invalid`);return}n.setRangeText(i,a,o,`end`),r()}),n.addEventListener(`input`,r),r()}function rt(e){let t=document.querySelector(`#generatorBody`);if(t){if(z&&M===`searching`){let t=document.querySelector(`#searchTarget`);t&&(t.textContent=`${k(e.pattern,e.endPattern,e.position)}...`);return}t.innerHTML=`
    <div class="search-live" aria-live="polite">
      <p class="live-kicker search-pulse">Searching for address</p>
      <p class="live-target"><strong id="searchTarget">${U(k(e.pattern,e.endPattern,e.position))}...</strong></p>

      <div class="stat-grid stat-grid--live">
        <div class="stat-box">
          <div class="stat-title">Speed</div>
          <div class="stat-value" id="metricSpeed">0/sec</div>
        </div>
        <div class="stat-box">
          <div class="stat-title">Attempts</div>
          <div class="stat-value" id="metricAttempts">0</div>
        </div>
        <div class="stat-box">
          <div class="stat-title">Elapsed</div>
          <div class="stat-value" id="metricElapsed">00:00</div>
        </div>
      </div>

      <p class="field-hint" id="searchPerfHint">Performance: ${U(e.performance.toUpperCase())}</p>

      <button type="button" class="stop-btn" id="stopBtn">Stop search</button>
    </div>
  `,document.querySelector(`#stopBtn`)?.addEventListener(`click`,()=>{H.stop()}),z=!0}}function it(e){if(M!==`searching`||!R||e.searchId!==R.searchId)return;rt(R);let t=document.querySelector(`#metricAttempts`),n=document.querySelector(`#metricSpeed`),r=document.querySelector(`#metricElapsed`);t&&(t.textContent=W(e.attempts)),n&&(n.textContent=`${W(e.speed)}/sec`),r&&(r.textContent=Ze(e.elapsedMs))}function at(){let e=document.querySelector(`#generatorBody`);e&&(e.innerHTML=`
    <div class="stopped-panel">
      <p class="live-kicker">Search stopped</p>
      <p class="error-text">No address was generated.</p>
      <div class="action-row">
        <button type="button" class="secondary-btn" id="tryAgainBtn">Try again</button>
      </div>
    </div>
  `,document.querySelector(`#tryAgainBtn`)?.addEventListener(`click`,()=>{G(`idle`),$()}))}function ot(){let e=document.querySelector(`#generatorBody`);if(!e||!F)return;let t=F,n=`•`.repeat(64);e.innerHTML=`
    <div class="found-panel" data-lifecycle="${Le(t.backupStatus)}">
      <p class="live-kicker success">Address found</p>

      <div class="wallet-box">
        <div class="wallet-key" id="foundPublicKey">${U(t.publicKey)}</div>
        <div class="action-row">
          <button type="button" class="secondary-btn" id="copyPublicBtn">Copy address</button>
        </div>
      </div>

      <div class="wallet-box wallet-box--secure" id="backupUrgent">
        <div class="wallet-title">Secure your key</div>
        <p class="found-lead">
          This is the only key that controls this address.
          Save your backup before leaving this page.
        </p>
        <p class="keep-private-note">
          <strong>Keep this backup private.</strong>
          Anyone with this private key can control this wallet and its funds.
          Never send it through chat, email, or social media.
        </p>
        
        <div class="action-row">
          <button type="button" class="backup-btn" id="downloadKeyBackupBtn">Download key backup</button>
        </div>
        <p class="offline-hint">
          Recommended: store the backup offline in a secure location, for example on an encrypted USB drive.
        </p>
        <div id="backupConfirmArea" class="backup-confirm-area"></div>
      </div>

      <div class="wallet-box wallet-box--transfer" id="transferSection">
        <div class="wallet-title">Import on another device</div>
        <p class="found-lead">
          Optionally show a private-key QR to import into a wallet on another device.
        </p>
        <div class="action-row" id="qrActions">
          <button type="button" class="secondary-btn" id="showQrBtn">Show private-key QR</button>
        </div>
        <p class="field-hint">Scan only with a wallet or device you trust.</p>
        <div id="qrPanel" class="qr-panel" hidden></div>
      </div>

      <details class="found-advanced" id="privateKeySection">
        <summary>Advanced</summary>
        <div class="found-advanced-body">
          <p class="private-key-warning" id="privateWarning">
            Reveal only if you need to copy the private key manually.
            Anyone who sees it can control this wallet.
          </p>
          <div
            class="wallet-key wallet-key--private"
            id="privateKeyDisplay"
            data-hidden="true"
            aria-label="Private key hidden"
            hidden
          >${n}</div>
          <div class="action-row" id="privateActions">
            <button type="button" class="secondary-btn" id="revealPrivateBtn">Reveal private key</button>
          </div>
          <p class="copy-feedback" id="privateFeedback" hidden aria-live="polite"></p>
        </div>
      </details>

      <div class="action-row">
        <button type="button" class="secondary-btn danger-outline-btn" id="anotherBtn">Generate another address</button>
      </div>
    </div>
  `,X(),document.querySelector(`#generatorCard`)?.scrollIntoView({block:`start`,behavior:`smooth`}),st()}function st(){if(!F)return;let e=F;document.querySelector(`#copyPublicBtn`)?.addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(e.publicKey)}catch{}}),document.querySelector(`#downloadKeyBackupBtn`)?.addEventListener(`click`,()=>{F&&(te(ee(F.publicKey),p(F.publicKey,F.privateKey)),ct())}),document.querySelector(`#revealPrivateBtn`)?.addEventListener(`click`,()=>{dt()}),document.querySelector(`#showQrBtn`)?.addEventListener(`click`,()=>{ft()}),document.querySelector(`#anotherBtn`)?.addEventListener(`click`,()=>{pt()})}function ct(){F&&(F.backupStatus=Re(F.backupStatus),V(),X())}function lt(){F&&(F.backupStatus=ze(),V(),ut(),X())}function ut(){if(!F)return;let e=document.querySelector(`.found-panel`);e&&e.setAttribute(`data-lifecycle`,Le(F.backupStatus))}function X(){if(!F)return;let e=document.querySelector(`#backupConfirmArea`);if(e){if(e.innerHTML=``,ut(),F.backupStatus===`confirmed`){let t=document.createElement(`p`);t.className=`backup-status backup-status--ok`,t.id=`backupStatus`,t.textContent=`Backup confirmed. You can safely continue. The private key stays only in this tab until you leave.`,e.appendChild(t);return}if(F.backupStatus===`downloaded`){let t=document.createElement(`p`);t.className=`backup-status backup-status--ok`,t.id=`backupStatus`,t.textContent=`Backup downloaded`;let n=document.createElement(`p`);n.className=`offline-hint`,n.textContent=`Before confirming, store the file somewhere safe and preferably offline.`;let r=document.createElement(`label`);r.className=`backup-confirm-label`,r.htmlFor=`confirmBackupCheck`;let i=document.createElement(`input`);i.type=`checkbox`,i.id=`confirmBackupCheck`,i.addEventListener(`change`,()=>{i.checked&&lt()});let a=document.createElement(`span`);a.textContent=`I have safely stored my backup`,r.append(i,a),e.append(t,n,r)}}}async function dt(){F&&(!await m({title:`Reveal private key?`,paragraphs:[`Your private key gives full control of this address.`,`Anyone who sees, copies, photographs or scans it can control the wallet and its funds.`,`Only reveal it when nobody else can see your screen.`],confirmLabel:`I understand — reveal`,cancelLabel:`Cancel`,dangerConfirm:!0})||!F||ht())}async function ft(){F&&(!await m({title:`Show private-key QR?`,paragraphs:[`This QR code contains your private key.`,`Anyone who scans or photographs this QR code can control this wallet.`,`Only show it when nobody else can see your screen, and only scan it with a wallet or device you trust.`],confirmLabel:`I understand — show QR`,cancelLabel:`Cancel`,dangerConfirm:!0})||!F||_t())}async function pt(){if(!F){G(`idle`),$();return}if(E(F.backupStatus)){if(!await m({title:`Your current private key has not been confirmed as backed up`,paragraphs:[`If you continue, this private key will be removed from this page and may not be recoverable.`,`Go back and download a backup first unless you are certain you no longer need this keypair.`],confirmLabel:`I understand — discard this key`,cancelLabel:`Go back and back it up`,dangerConfirm:!0}))return}else if(!await m({title:`Generate another address?`,paragraphs:[`This will clear the current result from this tab.`,`Continue only if you already stored your backup offline.`],confirmLabel:`Continue`,cancelLabel:`Cancel`,dangerConfirm:!0}))return;Z(),tt(),R=null,G(`idle`),$()}async function mt(){return!F||!E(F.backupStatus)?!0:m({title:`Your current private key has not been confirmed as backed up`,paragraphs:[`Starting a new search will remove this private key from this page and it may not be recoverable.`,`Go back and download a backup first unless you are certain you no longer need this keypair.`],confirmLabel:`I understand — discard this key`,cancelLabel:`Go back and back it up`,dangerConfirm:!0})}function ht(){if(!F)return;F.revealed=!0;let e=document.querySelector(`#privateKeyDisplay`),t=document.querySelector(`#privateWarning`),n=document.querySelector(`#privateKeySection`);n&&(n.open=!0),t&&(t.textContent=`Never share your private key. Anyone with this key can control this wallet.`),e&&(e.hidden=!1,e.textContent=F.privateKey,e.setAttribute(`data-hidden`,`false`),e.removeAttribute(`aria-label`)),yt()}function gt(){if(!F)return;F.revealed=!1;let e=document.querySelector(`#privateKeyDisplay`),t=document.querySelector(`#privateWarning`);t&&(t.textContent=`Reveal only if you need to copy the private key manually. Anyone who sees it can control this wallet.`),e&&(e.hidden=!0,e.textContent=`•`.repeat(64),e.setAttribute(`data-hidden`,`true`),e.setAttribute(`aria-label`,`Private key hidden`)),yt()}function _t(){if(!F)return;let e=document.querySelector(`#qrPanel`);if(!e)return;let t;try{t=Ie(F.privateKey)}catch{let e=document.querySelector(`#privateFeedback`);e&&(e.hidden=!1,e.textContent=`Could not create the QR code in this browser.`);return}F.qrVisible=!0,e.hidden=!1,e.innerHTML=`
    <div class="wallet-title">Private key QR</div>
    <div class="qr-frame" id="qrFrame" aria-label="Private key QR code">${t}</div>
    <p class="private-key-warning">
      This QR code contains your private key.
      Scan it only with a wallet or device you trust.
    </p>
    <div class="action-row">
      <button type="button" class="tertiary-btn" id="hideQrBtn">Hide QR</button>
    </div>
  `,document.querySelector(`#hideQrBtn`)?.addEventListener(`click`,()=>{Z()}),vt()}function Z(){F&&(F.qrVisible=!1);let e=document.querySelector(`#qrPanel`);e&&(e.hidden=!0,e.innerHTML=``),vt()}function vt(){if(!F)return;let e=document.querySelector(`#qrActions`);if(e){if(F.qrVisible){e.innerHTML=``;return}e.innerHTML=`<button type="button" class="secondary-btn" id="showQrBtn">Show private-key QR</button>`,document.querySelector(`#showQrBtn`)?.addEventListener(`click`,()=>{ft()})}}function yt(){if(!F)return;let e=document.querySelector(`#privateActions`);e&&(F.revealed?e.innerHTML=`
      <button type="button" class="secondary-btn" id="copyPrivateBtn">Copy private key</button>
      <button type="button" class="tertiary-btn" id="hidePrivateBtn">Hide private key</button>
    `:e.innerHTML=`
      <button type="button" class="secondary-btn" id="revealPrivateBtn">Reveal private key</button>
    `,document.querySelector(`#revealPrivateBtn`)?.addEventListener(`click`,()=>{dt()}),document.querySelector(`#hidePrivateBtn`)?.addEventListener(`click`,()=>{gt()}),document.querySelector(`#copyPrivateBtn`)?.addEventListener(`click`,async()=>{if(!F?.revealed)return;let e=document.querySelector(`#privateFeedback`);try{await navigator.clipboard.writeText(F.privateKey),e&&(e.hidden=!1,e.textContent=`Private key copied.`,window.setTimeout(()=>{e.hidden=!0},2400))}catch{e&&(e.hidden=!1,e.textContent=`Copy failed. Select the private key and copy manually.`)}}))}function Q(e){let t=document.querySelector(`#generatorBody`);t&&(t.innerHTML=`
    <div class="error-panel">
      <p class="live-kicker danger">Unable to generate</p>
      <p class="error-text">${U(e)}</p>
      <button type="button" class="secondary-btn" id="backBtn">Back</button>
    </div>
  `,document.querySelector(`#backBtn`)?.addEventListener(`click`,()=>{G(`idle`),$()}))}function bt(){let e=document.querySelector(`#threadHint`);if(!e)return;let t=j({preset:L.performance,hardwareConcurrency:navigator.hardwareConcurrency||4,isMobile:A()});e.textContent=`Detected: ${t.hardwareConcurrency} CPU threads${t.isMobile?` · mobile device`:``} · ${t.preset.toUpperCase()} uses ${t.workers} workers`}function $(){let e=document.querySelector(`#generatorBody`);if(!e)return;let t=A(),n=L;e.innerHTML=`
    <p class="mode-label">Your address should:</p>
    <div class="mode-tabs" role="radiogroup" aria-label="Where the text should appear">
      <label class="mode-tab">
        <input type="radio" name="positionPrimary" value="prefix" ${n.positionPrimary===`prefix`?`checked`:``} />
        <span>Start with</span>
      </label>
      <label class="mode-tab">
        <input type="radio" name="positionPrimary" value="suffix" ${n.positionPrimary===`suffix`?`checked`:``} />
        <span>End with</span>
      </label>
      <label class="mode-tab">
        <input type="radio" name="positionPrimary" value="anywhere" ${n.positionPrimary===`anywhere`?`checked`:``} />
        <span>Contain</span>
      </label>
    </div>

    <div id="patternFields"></div>

    <div class="toggle-row">
      <input id="caseSensitive" type="checkbox" ${n.caseSensitive?`checked`:``} />
      <label for="caseSensitive">Case sensitive</label>
    </div>

    <div id="difficultyPanel" class="difficulty-panel"></div>

    ${t?`<p class="mobile-note">Longer vanity searches are faster on desktop and may use significant battery on mobile.</p>`:``}

    <details class="advanced-block" ${n.advancedOpen?`open`:``}>
      <summary>Advanced settings</summary>
      <div class="advanced-body">
        <p class="field-hint">Optional modes and performance for power users.</p>

        <p class="field-hint"><strong>Advanced search</strong></p>
        <label class="advanced-option">
          <input type="radio" name="positionAdvanced" value="" ${n.positionAdvanced===``?`checked`:``} />
          Use primary mode above
        </label>
        <label class="advanced-option">
          <input type="radio" name="positionAdvanced" value="both" ${n.positionAdvanced===`both`?`checked`:``} />
          Start OR end
        </label>
        <label class="advanced-option">
          <input type="radio" name="positionAdvanced" value="bothEnds" ${n.positionAdvanced===`bothEnds`?`checked`:``} />
          Start AND end
        </label>
        <p class="field-hint warning-text">
          Start AND end is exponentially harder. Prefer short patterns.
        </p>

        <label for="performance">Performance</label>
        <div class="performance-radios" role="radiogroup" aria-label="Performance">
          <label class="advanced-option">
            <input type="radio" name="performanceChoice" value="low" ${n.performance===`low`?`checked`:``} />
            Low
          </label>
          <label class="advanced-option">
            <input type="radio" name="performanceChoice" value="auto" ${n.performance===`auto`||n.performance===`balanced`?`checked`:``} />
            Auto
          </label>
          <label class="advanced-option">
            <input type="radio" name="performanceChoice" value="maximum" ${n.performance===`maximum`?`checked`:``} />
            Maximum
          </label>
        </div>
        <select id="performance" class="visually-hidden" aria-hidden="true" tabindex="-1">
          <option value="auto" ${n.performance===`auto`||n.performance===`balanced`?`selected`:``}>AUTO</option>
          <option value="low" ${n.performance===`low`?`selected`:``}>Low</option>
          <option value="maximum" ${n.performance===`maximum`?`selected`:``}>Maximum</option>
        </select>
        <p class="field-hint" id="threadHint"></p>
      </div>
    </details>

    <div class="action-row">
      <button type="button" class="primary-btn" id="startBtn" ${I?``:`disabled`}>
        Generate address
      </button>
    </div>
    <p class="support-status" id="cryptoStatus"></p>
  `,Ct(),Y(),bt(),xt()}function xt(){let e=document.querySelector(`#cryptoStatus`),t=document.querySelector(`#startBtn`);if(e){if(!I){e.textContent=`Checking browser cryptography support…`,t&&(t.disabled=!0);return}e.textContent=P?`Ed25519 compatibility mode enabled for this browser.`:`Generated locally. Private keys are never stored on this site.`,t&&(t.disabled=!1)}}function St(){let e=document.querySelector(`input[name="performanceChoice"]:checked`)?.value||`auto`,t=document.querySelector(`#performance`);t&&(t.value=e===`balanced`?`auto`:e),L=K(),L.performance=e===`low`||e===`maximum`?e:`auto`,bt(),J()}function Ct(){document.querySelectorAll(`input[name="positionPrimary"]`).forEach(e=>{e.addEventListener(`change`,()=>{let e=document.querySelector(`input[name="positionAdvanced"][value=""]`);e&&(e.checked=!0),L=K(),Y()})}),document.querySelectorAll(`input[name="positionAdvanced"]`).forEach(e=>{e.addEventListener(`change`,()=>{L=K(),Y()})}),document.querySelector(`#caseSensitive`)?.addEventListener(`change`,()=>{L=K(),J()}),document.querySelectorAll(`input[name="performanceChoice"]`).forEach(e=>{e.addEventListener(`change`,St)}),document.querySelector(`details.advanced-block`)?.addEventListener(`toggle`,()=>{L=K()}),document.querySelector(`#startBtn`)?.addEventListener(`click`,()=>{wt()})}async function wt(){if(!I){G(`error`),Q(`Ed25519 is not available in this browser. Please update your browser and try again.`);return}L=K();let e=L.pattern,t=L.endPattern,n=q(L),r=L.caseSensitive,i=Ue(e,t,n);if(!i.ok){G(`error`),Q(i.message);return}if(!await mt())return;H.isSearching&&H.stop({silent:!0}),tt();let a=j({preset:L.performance,hardwareConcurrency:navigator.hardwareConcurrency||4,isMobile:A()}),o=H.start({match:{pattern:e,endPattern:t,position:n,caseSensitive:r},plan:a,needsPolyfill:P,progressEvery:1e3});R={searchId:o,pattern:e,endPattern:t,position:n,caseSensitive:r,performance:L.performance},G(`searching`),z=!1,rt(R),it({searchId:o,attempts:0,elapsedMs:0,speed:0,workers:a.workers})}function Tt(){let e=document.querySelector(`#recentWallets`);if(!e)return;let t=O();if(t.length===0){e.innerHTML=`<p class="muted">No recent public addresses yet.</p>`;return}e.innerHTML=t.map(e=>`
      <article class="recent-card" data-public-key="${U(e.publicKey)}">
        <div class="wallet-title">${U(e.pattern)} · ${U(e.position)}</div>
        <div class="wallet-key">${U(e.publicKey)}</div>
        <p class="recent-meta">${U(e.createdAt)}</p>
        <button type="button" class="secondary-btn copy-recent-public">Copy address</button>
      </article>
    `).join(``),e.querySelectorAll(`.recent-card`).forEach(e=>{let t=e.dataset.publicKey;t&&e.querySelector(`.copy-recent-public`)?.addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(t)}catch{}})})}function Et(){let e=document.querySelector(`#donationCopyBtn`),t=document.querySelector(`#donationConfirm`);!e||!t||e.addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText($e),t.removeAttribute(`hidden`),t.textContent=`Address copied.`}catch{t.removeAttribute(`hidden`),t.textContent=`Copy failed. Select the address above and copy manually.`}window.setTimeout(()=>{t.setAttribute(`hidden`,``)},2400)})}Qe.innerHTML=`
  <main class="app-shell">
    <header class="site-header">
      <div class="hero-banner" aria-hidden="true">
        <img
          class="hero-banner-img"
          src="/assets/banner.png"
          width="2103"
          height="748"
          alt=""
          decoding="async"
          fetchpriority="high"
        />
      </div>
      <div class="brand-block">
        <h1 class="brand-name">Solana Address Generator</h1>
        <p class="brand-tagline">
          Create a custom address for Solana — locally on your device.
        </p>
        <ul class="trust-line">
          <li><span class="trust-dot trust-dot--accent" aria-hidden="true"></span>Local generation</li>
          <li><span class="trust-dot" aria-hidden="true"></span>No wallet connection</li>
          <li><span class="trust-dot" aria-hidden="true"></span>Keys stay on this device</li>
        </ul>
      </div>
    </header>

    <section class="page-section card card--generator" id="generatorCard" data-mode="idle" aria-labelledby="generator-heading">
      <div class="card-header">
        <h2 id="generator-heading" class="visually-hidden">Generate address</h2>
      </div>
      <div id="generatorBody"></div>
    </section>

    <section class="page-section card card--secondary" aria-labelledby="recent-heading">
      <div class="card-header">
        <h2 id="recent-heading">Recent public addresses</h2>
        <p class="card-lede">Only public addresses are saved here. Private keys are never stored.</p>
      </div>
      <div id="recentWallets"></div>
      <button type="button" class="tertiary-btn" id="clearRecentBtn">Clear recent addresses</button>
    </section>

    <section class="support-section" aria-labelledby="support-title">
      <div class="support-card">
        <p class="support-title" id="support-title">Support development</p>
        <p class="support-text">Optional donations help keep this tool free.</p>
        <code class="support-wallet">${$e}</code>
        <button type="button" class="secondary-btn" id="donationCopyBtn">Copy address</button>
        <p class="support-confirm" id="donationConfirm" hidden aria-live="polite">Address copied.</p>
      </div>
    </section>

    <footer class="site-footer">
      <p class="site-footer-copy">
        Independent open-source tool for Solana · Built by
        <a href="https://tools.cbs-coin.com" target="_blank" rel="noopener noreferrer">CBS Tools</a>
        · Not affiliated with the Solana Foundation
      </p>
    </footer>
  </main>
`,$(),Tt(),Et(),document.querySelector(`#clearRecentBtn`)?.addEventListener(`click`,()=>{Ye(),Tt()}),(async()=>{let e=await d();if(!e.ok){I=!1,G(`error`),Q(e.reason);return}I=!0,P=e.polyfilled,M===`idle`&&xt();try{let e=j({preset:`auto`,hardwareConcurrency:navigator.hardwareConcurrency||4,isMobile:A()}),t=await new Promise(t=>{let n=0,r=[],i=1.25;window.setTimeout(()=>{for(let e of r){try{e.postMessage({type:`cancel`,searchId:0})}catch{}e.terminate()}t(Math.round(n/i))},i*1e3);for(let t=0;t<e.workers;t++){let t=new Worker(new URL(``+new URL(`kitWorker-CtlEtlWa.js`,import.meta.url).href,``+import.meta.url),{type:`module`});t.onmessage=e=>{e.data?.type===`progress`&&(n+=e.data.attempts||0)},t.postMessage({type:`start`,searchId:0,pattern:`ZZZZZ`,endPattern:``,position:`prefix`,caseSensitive:!0,batchConcurrency:e.batchConcurrency,progressEvery:500,needsPolyfill:P}),r.push(t)}});t>0&&(N=t,M===`idle`&&J())}catch{}})(),window.addEventListener(`pagehide`,()=>{H.stop({silent:!0})});