#!/usr/bin/env node
/*
 * build_variant.js — stamp out a per-influencer variant of a portal demo (WorldFirst 万里汇 OR Zyla).
 *
 * Usage:
 *   node build_variant.js --brand <worldfirst|zyla> --slug <slug> --password "<pw>" --config <config.json>
 *   (--brand defaults to worldfirst)
 *
 * Reads the locked benchmark for that brand, injects an AES-GCM-encrypted tailored
 * config behind a brand-styled password gate, writes <out>/<slug>/index.html.
 * The benchmark itself is never modified.
 *
 * Output links:
 *   worldfirst -> https://socialworldfirst.github.io/wf-portal-demo/u/<slug>/
 *   zyla       -> https://socialworldfirst.github.io/wf-portal-demo/zyla/u/<slug>/
 */
const fs = require('fs');
const path = require('path');
const { webcrypto } = require('crypto');
const subtle = webcrypto.subtle;

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const brand = (arg('brand', 'worldfirst') || 'worldfirst').toLowerCase();
const slug = arg('slug');
const password = arg('password');
const configPath = arg('config');
if (!slug || !password || !configPath) {
  console.error('Usage: node build_variant.js --brand <worldfirst|zyla> --slug <slug> --password "<pw>" --config <config.json>');
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(slug)) { console.error('slug must be [a-z0-9-]'); process.exit(1); }

const BRANDS = {
  worldfirst: { src: 'index.html', out: 'u', link: '/wf-portal-demo/u/',
    grad: 'linear-gradient(150deg,#FD3A4B 0%,#F31C46 60%,#D8113A 100%)', accent: '#FF0051', accentD: '#E0004a',
    logo: '万里汇 <small style="font-size:.46em;font-weight:600;opacity:.92;margin-left:2px">World First</small>', defLang: 'zh' },
  zyla: { src: 'zyla/index.html', out: 'zyla/u', link: '/wf-portal-demo/zyla/u/',
    grad: 'linear-gradient(150deg,#3A1FB8 0%,#0072E0 55%,#00B3E6 100%)', accent: '#0072E0', accentD: '#005FBD',
    logo: 'zyla', defLang: 'zh' }
};
const B = BRANDS[brand];
if (!B) { console.error('brand must be worldfirst or zyla'); process.exit(1); }

const ROOT = __dirname;
const benchmark = fs.readFileSync(path.join(ROOT, B.src), 'utf8');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const gateLang = (arg('lang', config.lang || B.defLang) === 'en') ? 'en' : 'zh';

const LAB = {
  zh: { tag: '一个账户<br>连接全球生意', sub: '全球收款、多币种持有、低成本兑换、快速付款。', h: '账户登录', p: '请输入专属访问密码登录您的账户', pw: '访问密码', btn: '登 录', loading: '登录中…', err: '密码不正确，请检查后重试', foot: '本页面为演示环境，所有数据均为虚构展示。' },
  en: { tag: 'One account,<br>global business.', sub: 'Collect worldwide, hold multiple currencies, convert and pay at low cost.', h: 'Account login', p: 'Enter your access password to open your account', pw: 'Access password', btn: 'Log in', loading: 'Logging in…', err: 'Incorrect password, please try again', foot: 'Demo environment. All data shown is fictional.' }
}[gateLang];

function b64(buf) { return Buffer.from(buf).toString('base64'); }

(async () => {
  const enc = new TextEncoder();
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const km = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    km, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
  );
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(config)));
  const SALT = b64(salt), IV = b64(iv), CT = b64(new Uint8Array(ct));

  // shim: runs at the very top of the app script, before data consts evaluate
  const shim = "try{var __s=sessionStorage.getItem('WFV_" + slug + "');if(__s)window.WF_VARIANT=JSON.parse(__s);}catch(e){}";

  // brand-styled password gate injected at top of <body>
  const gate = `<div id="wf-gate">
  <div class="wg-left">
    <div class="wg-logo">${B.logo}</div>
    <div class="wg-tag">${LAB.tag}</div>
    <div class="wg-sub">${LAB.sub}</div>
  </div>
  <div class="wg-right">
    <form class="wg-card" id="wg-form" autocomplete="off">
      <div class="wg-h">${LAB.h}</div>
      <div class="wg-p">${LAB.p}</div>
      <input id="wg-pw" type="password" placeholder="${LAB.pw}" autocomplete="off" spellcheck="false"/>
      <div id="wg-err" class="wg-err"></div>
      <button class="wg-btn" type="submit">${LAB.btn}</button>
      <div class="wg-foot">${LAB.foot}</div>
    </form>
  </div>
</div>
<style>
#wf-gate{position:fixed;inset:0;z-index:99999;display:flex;background:#fff;font-family:roboto,"PingFang SC","Microsoft YaHei",sans-serif}
#wf-gate .wg-left{width:46%;background:${B.grad};color:#fff;padding:80px 64px;display:flex;flex-direction:column;justify-content:center}
#wf-gate .wg-logo{font-size:42px;font-weight:800;letter-spacing:.5px;margin-bottom:40px}
#wf-gate .wg-tag{font-size:40px;font-weight:700;line-height:1.25;margin-bottom:22px}
#wf-gate .wg-sub{font-size:15px;line-height:1.8;opacity:.92;max-width:420px}
#wf-gate .wg-right{flex:1;display:flex;align-items:center;justify-content:center;padding:40px}
#wf-gate .wg-card{width:360px;display:flex;flex-direction:column}
#wf-gate .wg-h{font-size:26px;font-weight:700;color:#1A1A1A;margin-bottom:8px}
#wf-gate .wg-p{font-size:14px;color:#9a9aa2;margin-bottom:28px}
#wf-gate #wg-pw{height:50px;border:1px solid #E4E4E8;border-radius:10px;padding:0 16px;font-size:15px;outline:none;transition:border .15s}
#wf-gate #wg-pw:focus{border-color:${B.accent}}
#wf-gate .wg-err{color:#E0004a;font-size:13px;min-height:18px;margin:8px 2px 0}
#wf-gate .wg-btn{height:50px;margin-top:14px;border:none;border-radius:10px;background:${B.accent};color:#fff;font-size:16px;font-weight:600;letter-spacing:2px;cursor:pointer;transition:background .15s}
#wf-gate .wg-btn:hover{background:${B.accentD}}
#wf-gate .wg-btn:disabled{opacity:.6;cursor:default}
#wf-gate .wg-foot{margin-top:26px;font-size:12px;color:#b7b7be;text-align:center}
@media(max-width:860px){#wf-gate .wg-left{display:none}}
</style>
<script>
(function(){
  var SLUG=${JSON.stringify(slug)}, SALT=${JSON.stringify(SALT)}, IV=${JSON.stringify(IV)}, CT=${JSON.stringify(CT)}, ERR=${JSON.stringify(LAB.err)}, LOADING=${JSON.stringify(LAB.loading)}, BTN=${JSON.stringify(LAB.btn)};
  var pre=null; try{pre=sessionStorage.getItem('WFV_'+SLUG);}catch(e){}
  var gate=document.getElementById('wf-gate');
  if(pre){ if(gate) gate.style.display='none'; return; }
  function b2u(s){var bin=atob(s),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}
  async function unlock(pw){
    var km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
    var key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:b2u(SALT),iterations:100000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['decrypt']);
    var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b2u(IV)},key,b2u(CT));
    return new TextDecoder().decode(pt);
  }
  document.getElementById('wg-form').addEventListener('submit',async function(e){
    e.preventDefault();
    var pw=document.getElementById('wg-pw').value.trim(), err=document.getElementById('wg-err'), btn=document.querySelector('.wg-btn');
    if(!pw) return;
    btn.disabled=true; btn.textContent=LOADING; err.textContent='';
    try{
      var json=await unlock(pw); JSON.parse(json);
      sessionStorage.setItem('WFV_'+SLUG, json);
      location.reload();
    }catch(_){
      err.textContent=ERR; btn.disabled=false; btn.textContent=BTN;
      document.getElementById('wg-pw').value=''; document.getElementById('wg-pw').focus();
    }
  });
  document.getElementById('wg-pw').focus();
})();
</script>`;

  let out = benchmark;
  if (!out.includes('/*__VARIANT_SHIM__*/')) { console.error('benchmark missing shim marker'); process.exit(1); }
  if (!out.includes('<!--__VARIANT_GATE__-->')) { console.error('benchmark missing gate marker'); process.exit(1); }
  out = out.replace('/*__VARIANT_SHIM__*/', shim);
  out = out.replace('<!--__VARIANT_GATE__-->', gate);

  const dir = path.join(ROOT, B.out, slug);
  fs.mkdirSync(dir, { recursive: true });
  // variant lives at <out>/<slug>/ (two levels below the benchmark); assets/ -> ../../assets/
  out = out.replace(/(["'(])assets\//g, '$1../../assets/');
  fs.writeFileSync(path.join(dir, 'index.html'), out);

  console.log(JSON.stringify({
    brand, slug, lang: gateLang,
    link: 'https://socialworldfirst.github.io' + B.link + slug + '/',
    password,
    file: path.relative(ROOT, path.join(dir, 'index.html'))
  }, null, 2));
})();
