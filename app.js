// sleepy_nana — Rive integration
// Loads the .riv file, runs the state machine, reads dragTarget from the bound
// ViewModelInstance, and reflects it in the HUD readout.

(function () {
  const canvas = document.getElementById('riveCanvas');
  const loading = document.getElementById('loading');
  const hudFill = document.getElementById('hudFill');
  const hudValue = document.getElementById('hudValue');
  const stage = document.getElementById('stage');


  // Rive 인스턴스 — autoBind: true로 기본 ViewModel 인스턴스가 자동으로 붙음
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
      startHudPolling();
    },
    onLoadError: (e) => {
      console.error('Rive load error:', e);
      loading.querySelector('.loading-text').textContent = 'failed to load nana ⋆ try refreshing';
    },
  });

  // 캔버스 리사이즈 (devicePixelRatio 대응)
  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (r) r.resizeDrawingSurfaceToCanvas();
    }, 150);
  }
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);

  // HUD 폴링 — dragTarget(원본) 값을 읽어서 표시.
  // Converter Group(smoothDrag→round)의 보간된 결과를 보고 싶다면 별도 출력 프로퍼티 필요.
  // 여기서는 사용자 입력 신호인 dragTarget(0 or 100)을 표시 → CSS로 부드럽게 전환.
  let pollHandle = null;
  function startHudPolling() {
    const vmi = r.viewModelInstance;
    if (!vmi) {
      hudValue.textContent = '—';
      return;
    }
    const dragTargetProp = vmi.number('dragTarget');
    if (!dragTargetProp) {
      console.warn('dragTarget property not found on ViewModel');
      hudValue.textContent = '—';
      return;
    }

    // 부드러운 시각 표시를 위해 클라이언트에서도 보간
    let displayed = 0;
    function tick() {
      const target = dragTargetProp.value || 0;
      // 0.5초 정도의 추적 — Rive 내부 Converter Duration과 비슷하게
      displayed += (target - displayed) * 0.08;
      const v = Math.round(displayed);
      hudFill.style.width = v + '%';
      hudValue.textContent = v;
      if (v > 50) stage.classList.add('awake');
      else stage.classList.remove('awake');
      pollHandle = requestAnimationFrame(tick);
    }
    tick();
  }

  // 페이지 가시성에 따라 폴링 중단 — 불필요한 GPU 사용 방지
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && pollHandle) {
      cancelAnimationFrame(pollHandle);
      pollHandle = null;
    } else if (!document.hidden && !pollHandle && r) {
      startHudPolling();
    }
  });
})();
