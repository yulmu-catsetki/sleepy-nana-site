// bukbukbuk — 4-character Rive integration with speech bubbles
//
// Reads four ViewModel Number properties (nanaDragTarget / rikoDragTarget /
// bukiDragTarget / rinDragTarget), drives a per-character HUD bar, and
// positions speech bubbles above each character based on artboard coords.
//
// Concept: the four already-awake-but-drowsy clichés react to head pats
// (북북). Single dialogue pool per character — no sleepy/awake split.

(function () {
  const canvas = document.getElementById('riveCanvas');
  const canvasFrame = document.getElementById('canvasFrame');
  const loading = document.getElementById('loading');

  // 아트보드 크기 — 캐릭터 좌표를 화면 비율로 환산할 때 사용
  const ARTBOARD_W = 1200;
  const ARTBOARD_H = 400;

  // 캐릭터 메타 — Rive 프로퍼티 이름, 아트보드 내 중심 x 좌표(px),
  // 말풍선이 뜰 y 좌표(아트보드 기준, 머리 위쪽), HUD 채움 엘리먼트, 말풍선 엘리먼트.
  const CHARACTERS = [
    {
      id: 'nana',
      vmProp: 'nanaDragTarget',
      centerX: 219,
      bubbleY: 50,       // 머리 위 (아트보드 좌표, 작을수록 위)
      fillEl: document.getElementById('fill-nana'),
      bubbleEl: document.getElementById('bubble-nana'),
    },
    {
      id: 'riko',
      vmProp: 'rikoDragTarget',
      centerX: 474,
      bubbleY: 50,
      fillEl: document.getElementById('fill-riko'),
      bubbleEl: document.getElementById('bubble-riko'),
    },
    {
      id: 'shibuki',
      vmProp: 'bukiDragTarget',  // Rive에서는 buki...
      centerX: 730,
      bubbleY: 50,
      fillEl: document.getElementById('fill-shibuki'),
      bubbleEl: document.getElementById('bubble-shibuki'),
    },
    {
      id: 'morin',
      vmProp: 'rinDragTarget',
      centerX: 989,
      bubbleY: 50,
      fillEl: document.getElementById('fill-morin'),
      bubbleEl: document.getElementById('bubble-morin'),
    },
  ];

  // 캐릭터별 런타임 상태
  CHARACTERS.forEach(c => {
    c.displayed = 0;          // HUD 표시용 보간값
    c.prop = null;             // Rive ViewModel property ref
    c.bubbleVisible = false;
    c.bubbleHideTimer = null;
    c.bubbleNextLineTimer = null;
    c.lastLine = '';
  });

  // 대사 데이터 — dialogue.json에서 로드 (실패해도 페이지는 동작)
  let dialogueData = null;
  fetch('dialogue.json')
    .then(r => r.ok ? r.json() : null)
    .then(data => { dialogueData = data; })
    .catch(err => console.warn('Dialogue load failed:', err));

  // === 말풍선 로직 ===
  // 컨셉: 이미 깨어있고 살짝 몽롱한 클리셰를 쓰다듬을 때 그들이 반응하는 대사.
  // 인텐시티가 임계값을 넘으면 풀에서 랜덤하게 한 줄 등장. 분기 없음.
  const TRIGGER_THRESHOLD = 25;   // 이 이상 쓰다듬으면 반응 시작
  const BUBBLE_DURATION_MS = 1000;
  const BUBBLE_COOLDOWN_MS = 300;  // 다음 대사까지 텀
  const MIN_REPEAT_INTERVAL = 1800; // 같은 대사 너무 자주 반복 방지

  function pickLine(charId) {
    if (!dialogueData) return null;
    const cdata = dialogueData.characters && dialogueData.characters[charId];
    if (!cdata || !cdata.lines || cdata.lines.length === 0) return null;
    const char = CHARACTERS.find(c => c.id === charId);
    let attempts = 0;
    let line;
    do {
      line = cdata.lines[Math.floor(Math.random() * cdata.lines.length)];
      attempts++;
    } while (line === char.lastLine && cdata.lines.length > 1 && attempts < 5);
    char.lastLine = line;
    return line;
  }

  function showBubble(char, text) {
    if (!text) return;
    char.bubbleEl.textContent = text;
    char.bubbleEl.classList.add('visible');
    char.bubbleVisible = true;

    clearTimeout(char.bubbleHideTimer);
    char.bubbleHideTimer = setTimeout(() => {
      char.bubbleEl.classList.remove('visible');
      char.bubbleVisible = false;
    }, BUBBLE_DURATION_MS);
  }

  function maybeTriggerBubble(char, value) {
    // 임계값 넘었고, 말풍선 없고, 쿨다운 타이머도 없으면 → 새 대사
    if (value >= TRIGGER_THRESHOLD && !char.bubbleVisible && !char.bubbleNextLineTimer) {
      char.bubbleNextLineTimer = setTimeout(() => {
        char.bubbleNextLineTimer = null;
        // 여전히 쓰다듬어지고 있을 때만 띄움
        if (char.displayed >= TRIGGER_THRESHOLD) {
          showBubble(char, pickLine(char.id));
        }
      }, BUBBLE_COOLDOWN_MS);
    }
    // 거의 0으로 내려가면 말풍선 즉시 정리 (손 뗀 상태)
    if (value < 8 && char.bubbleVisible) {
      clearTimeout(char.bubbleHideTimer);
      char.bubbleEl.classList.remove('visible');
      char.bubbleVisible = false;
    }
  }

  // === 캔버스의 실제 화면 크기 기준으로 말풍선 위치 계산 ===
  function positionBubble(char) {
    // canvas-frame 내부에서 캔버스가 어떻게 그려졌는지 확인
    // canvas의 CSS 크기는 frame을 가득 채우므로 그 비율 그대로 사용
    const rect = canvas.getBoundingClientRect();
    const frameRect = canvasFrame.getBoundingClientRect();
    // canvas-frame 기준 상대 좌표 (말풍선은 frame의 자식이므로)
    const scaleX = rect.width / ARTBOARD_W;
    const scaleY = rect.height / ARTBOARD_H;
    const offsetX = rect.left - frameRect.left;
    const offsetY = rect.top - frameRect.top;
    const x = offsetX + char.centerX * scaleX;
    const y = offsetY + char.bubbleY * scaleY;
    char.bubbleEl.style.left = x + 'px';
    char.bubbleEl.style.top = y + 'px';
  }

  function positionAllBubbles() {
    CHARACTERS.forEach(positionBubble);
  }

  // === Rive 인스턴스 ===
  const r = new rive.Rive({
    src: 'sleepy_nana.riv',
    canvas: canvas,
    autoplay: true,
    stateMachines: 'State Machine 1',
    autoBind: true,
    onLoad: () => {
      r.resizeDrawingSurfaceToCanvas();
      loading.classList.add('hide');
      setTimeout(() => loading.remove(), 700);
      bindProperties();
      positionAllBubbles();
      startLoop();
    },
    onLoadError: (e) => {
      console.error('Rive load error:', e);
      const t = loading.querySelector('.loading-text');
      if (t) t.textContent = 'cliché is shy today ⋆ try refreshing';
    },
  });

  function bindProperties() {
    const vmi = r.viewModelInstance;
    if (!vmi) {
      console.warn('ViewModelInstance not bound');
      return;
    }
    CHARACTERS.forEach(c => {
      const p = vmi.number(c.vmProp);
      if (!p) {
        console.warn('Property not found:', c.vmProp);
      }
      c.prop = p;
    });
  }

  // === 메인 루프 ===
  let loopHandle = null;
  function startLoop() {
    function tick() {
      CHARACTERS.forEach(c => {
        const target = (c.prop && c.prop.value) || 0;
        // 클라이언트 보간 — Rive 내부 Converter와 비슷한 속도감
        c.displayed += (target - c.displayed) * 0.08;
        const v = Math.round(c.displayed);
        if (c.fillEl) c.fillEl.style.width = v + '%';
        maybeTriggerBubble(c, c.displayed);
      });
      loopHandle = requestAnimationFrame(tick);
    }
    tick();
  }

  // === 리사이즈 ===
  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (r) r.resizeDrawingSurfaceToCanvas();
      positionAllBubbles();
    }, 100);
  }
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  // ResizeObserver — 캔버스 프레임이 layout 변화로 바뀔 때도 대응
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => positionAllBubbles());
    ro.observe(canvasFrame);
  }

  // === 페이지 가시성 — 백그라운드 시 루프 중단 ===
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && loopHandle) {
      cancelAnimationFrame(loopHandle);
      loopHandle = null;
    } else if (!document.hidden && !loopHandle && r) {
      startLoop();
    }
  });
})();