/* ══════════════════════════════════════════════════════════════
   LANG
══════════════════════════════════════════════════════════════ */
function setLang(l) {
  document.documentElement.lang = l;
  document.body.className = 'lang-' + l;
  document.querySelectorAll('.lang-btn').forEach(b => {
    const on = b.textContent.trim().toLowerCase() === l;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  if (TTS.active) TTS.stop();
}

/* ══════════════════════════════════════════════════════════════
   PROGRESS BAR
══════════════════════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  document.getElementById('progress-bar').style.width =
    Math.min(h.scrollTop / (h.scrollHeight - h.clientHeight) * 100, 100) + '%';
}, { passive: true });

/* ══════════════════════════════════════════════════════════════
   TOC HIGHLIGHTS
══════════════════════════════════════════════════════════════ */
const vtocDots = document.querySelectorAll('.vtoc-dot');

document.querySelectorAll('section[id]').forEach(sec => {
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      vtocDots.forEach(d => d.classList.remove('active'));
      const vd = document.querySelector(`.vtoc-dot[data-href="#${id}"]`);
      if (vd) vd.classList.add('active');
    });
  }, { rootMargin: '-40% 0px -50% 0px' }).observe(sec);
});

/* Vertical TOC click + keyboard */
vtocDots.forEach(dot => {
  const go = () => {
    const t = document.querySelector(dot.dataset.href);
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  dot.addEventListener('click', go);
  dot.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
});

/* ══════════════════════════════════════════════════════════════
   TTS ENGINE — máquina de estados limpa
   ticket: cada utterance tem ID único; onend/onerror de utterances
   antigas são ignorados automaticamente.
   clickPara: para tudo e navega — nunca interfere com os botões.
══════════════════════════════════════════════════════════════ */
const TTS = (() => {
  const synth = window.speechSynthesis;
  const S = { IDLE: 0, PLAYING: 1, PAUSED: 2 };

  let state  = S.IDLE;
  let queue  = [];
  let curEl  = null;
  let ticket = 0;
  const origHTML = new Map();

  /* refs DOM — lazy, resolvidos na 1ª chamada a ui() */
  let B = null;
  function getB() {
    return B || (B = {
      btnPlay:  document.getElementById('btn-play'),
      btnPause: document.getElementById('btn-pause'),
      iPlay:    document.getElementById('icon-play'),
      iStop:    document.getElementById('icon-stop'),
      iPause:   document.getElementById('icon-pause'),
      iResume:  document.getElementById('icon-resume'),
      tip:      document.getElementById('read-tip'),
    });
  }

  /* elementos legíveis no idioma atual */
  function getReadables() {
    const lang = document.body.classList.contains('lang-en') ? 'en' : 'pt';
    const out  = [];
    document.querySelectorAll(
      'h2.sec-title, .rp, .profile-row, .step-item, .scales-list li, .i-list li, .levels-table tbody tr'
    ).forEach(el => {
      if (el.offsetParent === null) return;
      const lp = el.closest('[data-lang]');
      if (lp && lp.getAttribute('data-lang') !== lang) return;
      out.push(el);
    });
    return out;
  }

  function getText(el) {
    if (el.tagName === 'H2' && el.classList.contains('sec-title'))
      return el.textContent.trim();
    if (el.classList.contains('profile-row')) {
      const lbl   = el.querySelector('.profile-name-label')?.textContent?.trim() || '';
      const ds    = el.querySelector('.profile-desc')?.textContent?.trim() || '';
      const grads = el.getAttribute('data-grads') || '';
      return lbl + '. ' + ds + (grads ? ' Espectro: ' + grads : '');
    }
    if (el.classList.contains('step-item'))
      return (el.querySelector('.step-n')?.textContent?.trim()||'') + ': ' +
             (el.querySelector('.step-t')?.textContent?.trim()||'');
    if (el.tagName === 'TR')
      return [...el.querySelectorAll('td')].map(td=>td.textContent.trim()).join(': ');
    if (el.tagName === 'LI') {
      const s = el.querySelector('strong');
      if (s) return s.textContent.trim() + ': ' + el.textContent.replace(s.textContent,'').trim();
    }
    return el.textContent.trim();
  }

  function wrapWords(el) {
    if (!el.classList.contains('rp')) return;
    if (!origHTML.has(el)) origHTML.set(el, el.innerHTML);
    let i = 0, html = '';
    for (const tok of el.textContent.split(/(\s+)/))
      html += /\S/.test(tok) ? '<span class="w" data-i="' + (i++) + '">' + tok + '</span>' : tok;
    el.innerHTML = html;
  }

  function unwrap(el) {
    if (!el) return;
    if (el.classList.contains('rp') && origHTML.has(el)) el.innerHTML = origHTML.get(el);
    el.classList.remove('rp-active');
  }

  function ui() {
    const b      = getB();
    const idle   = state === S.IDLE;
    const paused = state === S.PAUSED;
    const pt     = document.body.classList.contains('lang-pt');

    b.iPlay.style.display  = idle ? '' : 'none';
    b.iStop.style.display  = idle ? 'none' : '';
    b.btnPlay.classList.toggle('is-active', !idle);
    b.btnPlay.setAttribute('aria-label',
      idle ? (pt ? 'Iniciar leitura' : 'Start reading')
           : (pt ? 'Parar leitura'   : 'Stop reading'));

    b.btnPause.style.display = idle ? 'none' : '';
    b.iPause.style.display   = paused ? 'none' : '';
    b.iResume.style.display  = paused ? '' : 'none';
    b.btnPause.classList.toggle('is-active', paused);
    b.btnPause.setAttribute('aria-label',
      paused ? (pt ? 'Continuar' : 'Resume') : (pt ? 'Pausar' : 'Pause'));

    if (idle) {
      b.tip.classList.remove('show');
    } else {
      b.tip.textContent = paused ? (pt?'Pausado':'Paused') : (pt?'Lendo…':'Reading…');
      b.tip.classList.add('show');
    }
  }

  function speakEl(el) {
    unwrap(curEl);
    curEl = el;
    const myTicket = ++ticket;   /* callbacks só agem se ticket ainda bater */

    el.classList.add('rp-active');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    wrapWords(el);

    const text = getText(el);
    if (!text) { _advance(); return; }

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang  = document.body.classList.contains('lang-en') ? 'en-US' : 'pt-BR';
    utt.rate  = parseFloat(document.getElementById('speed-sel').value) || 1;

    if (el.classList.contains('rp')) {
      const raw = el.textContent;
      utt.onboundary = evt => {
        if (ticket !== myTicket || evt.name !== 'word') return;
        const ci = evt.charIndex;
        let wi = 0, pos = 0;
        for (const tok of raw.split(/(\s+)/)) {
          if (/\S/.test(tok)) {
            if (ci >= pos && ci < pos + tok.length) {
              el.querySelectorAll('.w').forEach(s => s.classList.toggle('w-on', +s.dataset.i === wi));
              return;
            }
            wi++;
          }
          pos += tok.length;
        }
      };
    }

    utt.onend = utt.onerror = () => {
      if (ticket !== myTicket) return;
      if (state === S.PLAYING) { unwrap(el); _advance(); }
    };

    synth.speak(utt);
  }

  function _advance() {
    if (state !== S.PLAYING || !queue.length) { _stopNow(true); return; }
    speakEl(queue.shift());
  }

  /* para internamente; se renderUI=false, o chamador renderiza depois */
  function _stopNow(renderUI) {
    ticket++;
    synth.cancel();
    unwrap(curEl);
    curEl = null;
    queue = [];
    state = S.IDLE;
    if (renderUI) ui();
  }

  function _play(fromEl) {
    _stopNow(false);
    const all = getReadables();
    if (!all.length) { ui(); return; }
    const idx = fromEl ? Math.max(all.indexOf(fromEl), 0) : 0;
    queue = all.slice(idx + 1);
    state = S.PLAYING;
    ui();
    speakEl(all[idx]);
  }

  return {
    togglePlay()  { state !== S.IDLE ? _stopNow(true) : _play(null); },
    togglePause() {
      if      (state === S.PLAYING) { synth.pause();  state = S.PAUSED;  ui(); }
      else if (state === S.PAUSED)  { synth.resume(); state = S.PLAYING; ui(); }
    },
    speedChange() { if (state !== S.IDLE) _play(curEl); },
    /* clique num parágrafo:
       - se áudio ativo → para o atual e começa a ler o clicado
       - se idle        → só navega até ele */
    clickPara(el) {
      if (state !== S.IDLE) {
        _play(el);          /* _play chama _stopNow internamente antes de começar */
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    get active()  { return state !== S.IDLE; }
  };
})();

function ttsTogglePlay()  { TTS.togglePlay(); }
function ttsTogglePause() { TTS.togglePause(); }
function ttsSpeedChange() { TTS.speedChange(); }

/* ── Click em .rp: para áudio e navega ──────────────────────
   Usa capture=true para agir antes de outros handlers.
   Ignora:
     · cliques dentro dos controles (#audio-controls, .lang-toggle)
     · movimentos > 5px entre pointerdown e click (seleção de texto)
   stopPropagation() para o evento não ser processado mais nenhuma vez.
──────────────────────────────────────────────────────────── */
let _pdX = 0, _pdY = 0;
document.addEventListener('pointerdown', e => { _pdX = e.clientX; _pdY = e.clientY; }, { capture: true, passive: true });

document.addEventListener('click', e => {
  if (e.target.closest('#audio-controls, .lang-toggle, #vtoc')) return;
  if (Math.abs(e.clientX - _pdX) > 5 || Math.abs(e.clientY - _pdY) > 5) return;

  /* resolve o elemento legível mais próximo do clique */
  const el = e.target.closest(
    'h2.sec-title, .rp, .profile-row, .step-item, .scales-list li, .i-list li, .levels-table tbody tr'
  );
  if (!el) return;

  e.stopPropagation();
  TTS.clickPara(el);
}, true);

if (!window.speechSynthesis) document.getElementById('audio-controls').style.display = 'none';