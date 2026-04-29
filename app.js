(() => {
  'use strict';

  const TRAINING_VALIDITY_MONTHS = 3;
  const STORAGE_KEY = 'ot_training_records_v1';

  const state = {
    mode: 'home',
    commonSlide: 0,
    selectedEquipmentId: null,
    equipmentSlide: 0
  };

  const app = document.getElementById('app');
  const dtLabel = document.getElementById('dtLabel');
  const breadcrumbBar = document.getElementById('breadcrumbBar');
  const breadcrumbInner = document.getElementById('breadcrumbInner');

  const ICONS = {
    map: '📍', walk: '🚶', car: '🚗', stairs: '🪜', phone: '📞', zap: '⚡', tag: '🏷️', fence: '🚧',
    power: '🔌', alert: '⚠️', check: '✅', bell: '🔔', 'hard-hat': '⛑️', ban: '🚫', drop: '💧',
    fork: '🍽️', hand: '🤲', flask: '🧪', glasses: '🥽', headphones: '🎧', vest: '🦺', glove: '🧤',
    ice: '🌨️', monitor: '🖥️', body: '🧍', eye: '👁️', search: '🔍', heart: '❤️', user: '👤',
    bulb: '💡', brush: '✨', shield: '🛡️', fire: '🔥', burn: '🌡️', book: '📖', ok: '✅'
  };

  const CARD_TYPE = {
    rule: { label: 'ПРАВИЛО', cls: 'sc-rule' },
    ban: { label: 'ЗАПРЕТ', cls: 'sc-ban' },
    warn: { label: 'ОПАСНОСТЬ', cls: 'sc-warn' },
    ok: { label: 'ОК', cls: 'sc-ok' }
  };

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function formatDate(date) {
    const d = new Date(date);
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  }

  function addMonths(date, months) {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== day) d.setDate(0);
    return d;
  }

  function getEquipmentById(id) {
    return window.OMD_EQUIPMENT.find((item) => item.id === id);
  }

  function saveTrainingRecord(record) {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    records.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 50)));
  }

  function updateDate() {
    const d = new Date();
    dtLabel.textContent = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setBreadcrumb(items = []) {
    if (!items.length) {
      breadcrumbBar.classList.add('hidden');
      breadcrumbInner.innerHTML = '';
      return;
    }

    breadcrumbBar.classList.remove('hidden');
    breadcrumbInner.innerHTML = items.map((item, index) => {
      const isLast = index === items.length - 1;
      const sep = index ? '<span class="bc-sep">/</span>' : '';
      return `${sep}<div class="bc-item ${isLast ? 'active' : ''}"><button data-bc="${index}" type="button">${esc(item.label)}</button></div>`;
    }).join('');

    breadcrumbInner.querySelectorAll('[data-bc]').forEach((button) => {
      const index = Number(button.dataset.bc);
      if (!items[index].onClick) return;
      button.addEventListener('click', items[index].onClick);
    });
  }

  function getIcon(name) {
    return `<span class="card-emoji-wrap">${ICONS[name] || name || '•'}</span>`;
  }

  function renderSafetyCard(card) {
    const type = CARD_TYPE[card.type] || CARD_TYPE.rule;
    return `
      <article class="safety-card ${type.cls}">
        <div class="safety-card-icon">${getIcon(card.icon)}</div>
        <div class="safety-card-title">${esc(card.title)}</div>
        <div class="safety-card-sub">${esc(card.sub)}</div>
        <div class="safety-card-badge ${type.cls}-badge">${type.label}</div>
      </article>
    `;
  }

  function renderStepper({ current, total, label }) {
    const pct = Math.round((current / total) * 100);
    const dots = Array.from({ length: total }, (_, index) => {
      const num = index + 1;
      const cls = num < current ? 'done' : num === current ? 'active' : '';
      return `<div class="flow-dot ${cls}">${num < current ? '✓' : num}</div>`;
    }).join('');

    return `
      <div class="flow-stepper">
        <div class="flow-stepper-top">
          <span class="flow-stepper-label">${esc(label)}</span>
          <span class="flow-stepper-pct">${pct}%</span>
        </div>
        <div class="flow-bar-outer"><div class="flow-bar-inner" style="width:${pct}%"></div></div>
        <div class="flow-dots">${dots}</div>
      </div>
    `;
  }

  function renderHome() {
    state.mode = 'home';
    setBreadcrumb([]);

    app.innerHTML = `
      <div class="page home-page">
        <section class="home-modern-hero">
          <div class="home-hero-bg-mark">ТБ</div>
          <div class="home-hero-topline">
            <span class="home-status-dot"></span>
            <span>Цифровой инструктаж сотрудников</span>
          </div>
          <div class="home-hero-main">
            <div class="home-hero-shield">🛡️</div>
            <div class="home-hero-copy">
              <h1 class="home-hero-title">Охрана труда при работе на оборудовании</h1>
              <p class="home-hero-sub">
                Последовательное обучение по подразделению и конкретной установке: общие требования,
                видео по оборудованию, карточки рисков и итоговая фиксация результата.
              </p>
            </div>
          </div>
          <div class="home-quick-panel">
            <div>
              <span class="home-quick-label">Периодичность</span>
              <strong>Повторное прохождение — раз в 3 месяца</strong>
            </div>
            <div class="home-quick-icon">📅</div>
          </div>
          <button class="btn btn-primary btn-full home-main-btn" id="employeeBtn" type="button">
            Начать обучение
          </button>
        </section>

        <section class="home-route-card">
          <div class="home-section-title">Маршрут прохождения</div>
          <div class="home-route-timeline">
            <div class="home-route-step active">
              <span>1</span>
              <div><strong>Подразделение</strong><p>Выбор участка, сектора или лаборатории</p></div>
            </div>
            <div class="home-route-step">
              <span>2</span>
              <div><strong>Общий модуль</strong><p>Правила, которые повторяются для оборудования</p></div>
            </div>
            <div class="home-route-step">
              <span>3</span>
              <div><strong>Установка</strong><p>Видео, опасные зоны и порядок работы</p></div>
            </div>
            <div class="home-route-step">
              <span>4</span>
              <div><strong>Результат</strong><p>Фиксация даты прохождения и срока действия 3 месяца</p></div>
            </div>
          </div>
        </section>

        <section class="home-dashboard-grid">
          <article class="home-mini-card">
            <span>4</span>
            <p>установки ОМД в пилоте</p>
          </article>
          <article class="home-mini-card">
            <span>3</span>
            <p>месяца действует обучение</p>
          </article>
        </section>
      </div>
    `;

    document.getElementById('employeeBtn').addEventListener('click', renderDepartments);
    scrollTop();
  }

  function renderDepartments() {
    state.mode = 'departments';
    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: 'Сотрудник' }
    ]);

    const items = window.DEPARTMENTS
      .filter((dept) => dept.id !== 'guest')
      .map((dept) => `
        <button class="list-card" type="button" data-dept="${dept.id}">
          <div class="list-card-header">
            <div class="list-card-icon">${dept.icon}</div>
            <div>
              <div class="list-card-title">${esc(dept.name)}</div>
              <div class="list-card-sub">${esc(dept.description)}</div>
              <div class="list-card-meta">
                <span class="badge ${dept.status === 'pilot' ? 'badge-orange' : 'badge-gray'}">${dept.status === 'pilot' ? 'пилот' : 'позже'}</span>
              </div>
            </div>
          </div>
        </button>
      `).join('');

    app.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="page-head-eyebrow">Сотрудник</div>
          <div class="page-head-title">Выберите подразделение</div>
          <div class="page-head-sub">Пока подробно прорабатываем участок ЭИП ОМД. Остальные направления уже заложены в структуру.</div>
        </div>
        <div class="list-stack">${items}</div>
        <div class="page-bottom-spacer"></div>
      </div>
    `;

    app.querySelectorAll('[data-dept]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.dept === 'omd') renderOmdCommon(0);
        else renderPlaceholderDepartment(btn.dataset.dept);
      });
    });
    scrollTop();
  }

  function renderPlaceholderDepartment(deptId) {
    const dept = window.DEPARTMENTS.find((item) => item.id === deptId);
    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: 'Сотрудник', onClick: renderDepartments },
      { label: dept.shortName }
    ]);

    app.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="page-head-eyebrow">Раздел в структуре</div>
          <div class="page-head-title">${esc(dept.name)}</div>
          <div class="page-head-sub">Этот раздел будет наполнен после отработки эталонного сценария на участке ЭИП ОМД.</div>
        </div>
        <div class="info-box">Сначала доводим до качества ОМД: общий модуль → установки → видео → тест. Потом масштабируем на остальные направления.</div>
      </div>
    `;
    scrollTop();
  }

  function renderOmdCommon(index = 0) {
    state.mode = 'omd-common';
    state.commonSlide = index;
    const module = window.OMD_COMMON;
    const slide = module.slides[index];
    const total = module.slides.length;

    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: 'Сотрудник', onClick: renderDepartments },
      { label: 'ЭИП ОМД' },
      { label: `Раздел ${index + 1}` }
    ]);

    app.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="page-head-eyebrow">Общий модуль участка</div>
          <div class="page-head-title">${esc(slide.title)}</div>
          <div class="page-head-sub">${esc(module.subtitle)}</div>
        </div>
        ${renderStepper({ current: index + 1, total, label: `Раздел ${index + 1} из ${total}` })}
        <div class="slide-block">
          <div class="slide-block-head">
            <div class="slide-block-num">${index + 1}</div>
            <div class="slide-block-title">${esc(slide.title)}</div>
          </div>
          <div class="slide-cards-grid">${slide.cards.map(renderSafetyCard).join('')}</div>
          <div class="slide-footer">
            <label class="confirm-row">
              <input type="checkbox" class="confirm-check" id="omdConfirm" />
              <span class="confirm-label">Ознакомлен с разделом</span>
            </label>
          </div>
        </div>
        <div class="page-bottom-spacer"></div>
      </div>
      <div class="sticky-bottom no-print">
        <div class="sticky-bottom-inner">
          <button class="btn btn-secondary" id="omdBack" type="button">← Назад</button>
          <button class="btn btn-primary btn-grow" id="omdNext" type="button" disabled>${index < total - 1 ? 'Следующий раздел →' : 'Выбрать установку →'}</button>
        </div>
      </div>
    `;

    const confirm = document.getElementById('omdConfirm');
    const next = document.getElementById('omdNext');
    confirm.addEventListener('change', () => { next.disabled = !confirm.checked; });
    document.getElementById('omdBack').addEventListener('click', () => {
      if (index > 0) renderOmdCommon(index - 1);
      else renderDepartments();
    });
    next.addEventListener('click', () => {
      if (index < total - 1) renderOmdCommon(index + 1);
      else renderEquipmentList();
    });
    scrollTop();
  }

  function renderEquipmentList() {
    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: 'Сотрудник', onClick: renderDepartments },
      { label: 'ЭИП ОМД', onClick: () => renderOmdCommon(0) },
      { label: 'Установки' }
    ]);

    const items = window.OMD_EQUIPMENT.map((equipment) => `
      <button class="list-card" type="button" data-equipment="${equipment.id}">
        <div class="list-card-header">
          <div class="list-card-icon">${equipment.icon}</div>
          <div>
            <div class="list-card-title">${esc(equipment.name)}</div>
            <div class="list-card-sub">${esc(equipment.description)}</div>
            <div class="list-card-meta">
              <span class="badge badge-blue">${esc(equipment.instruction)}</span>
              <span class="badge badge-gray">видео позже</span>
              <span class="badge badge-green">срок 3 месяца</span>
            </div>
          </div>
        </div>
      </button>
    `).join('');

    app.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="page-head-eyebrow">Участок ЭИП ОМД</div>
          <div class="page-head-title">Выберите установку</div>
          <div class="page-head-sub">Каждый модуль установки начнётся с вводного видео. После прохождения обучение действует 3 месяца.</div>
        </div>
        <div class="list-stack">${items}</div>
        <div class="page-bottom-spacer"></div>
      </div>
    `;

    app.querySelectorAll('[data-equipment]').forEach((btn) => {
      btn.addEventListener('click', () => renderEquipmentVideo(btn.dataset.equipment));
    });
    scrollTop();
  }

  function renderEquipmentVideo(id) {
    const equipment = getEquipmentById(id);
    state.selectedEquipmentId = id;
    state.equipmentSlide = 0;
    const total = (equipment.slides?.length || 0) + 2;

    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: 'ЭИП ОМД', onClick: () => renderOmdCommon(0) },
      { label: 'Установки', onClick: renderEquipmentList },
      { label: equipment.name }
    ]);

    app.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="page-head-eyebrow">${esc(equipment.instruction)}</div>
          <div class="page-head-title">${esc(equipment.name)}</div>
          <div class="page-head-sub">${esc(equipment.description)}</div>
        </div>
        ${renderStepper({ current: 1, total, label: `Шаг 1 из ${total} — видео по установке` })}
        <div class="slide-block">
          <div class="slide-block-head">
            <div class="slide-block-num">▶</div>
            <div class="slide-block-title">Вводное видео по установке</div>
          </div>
          <div class="video-placeholder">
            <div class="vp-icon">▶</div>
            <div class="vp-title">Видеоинструкция будет добавлена позже</div>
            <div class="vp-sub">Здесь будет ролик: назначение оборудования, опасные зоны, безопасный запуск, запреты и аварийные действия.</div>
            <button class="vp-play-btn" id="equipmentCardsBtn" type="button">Перейти к инструктажу</button>
            <div class="vp-note">Поле videoSrc уже предусмотрено в данных.</div>
          </div>
        </div>
        <div class="page-bottom-spacer"></div>
      </div>
      <div class="sticky-bottom no-print">
        <div class="sticky-bottom-inner">
          <button class="btn btn-secondary" id="equipmentBack" type="button">← Установки</button>
          <button class="btn btn-primary btn-grow" id="equipmentNext" type="button">К инструктажу →</button>
        </div>
      </div>
    `;

    document.getElementById('equipmentBack').addEventListener('click', renderEquipmentList);
    document.getElementById('equipmentNext').addEventListener('click', () => renderEquipmentSlide(id, 0));
    document.getElementById('equipmentCardsBtn').addEventListener('click', () => renderEquipmentSlide(id, 0));
    scrollTop();
  }

  function renderEquipmentSlide(id, index = 0) {
    const equipment = getEquipmentById(id);
    const slides = equipment.slides || [];
    const slide = slides[index];
    const total = slides.length + 2;
    const stepNumber = index + 2;
    state.equipmentSlide = index;

    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: 'ЭИП ОМД', onClick: () => renderOmdCommon(0) },
      { label: 'Установки', onClick: renderEquipmentList },
      { label: equipment.name, onClick: () => renderEquipmentVideo(id) },
      { label: `Раздел ${index + 1}` }
    ]);

    app.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="page-head-eyebrow">Инструктаж по установке</div>
          <div class="page-head-title">${esc(slide.title)}</div>
          <div class="page-head-sub">${esc(equipment.name)}</div>
        </div>
        ${renderStepper({ current: stepNumber, total, label: `Шаг ${stepNumber} из ${total} — ${slide.title}` })}
        <div class="slide-block">
          <div class="slide-block-head">
            <div class="slide-block-num">${index + 1}</div>
            <div class="slide-block-title">${esc(slide.title)}</div>
          </div>
          <div class="slide-cards-grid">${slide.cards.map(renderSafetyCard).join('')}</div>
          <div class="slide-footer">
            <label class="confirm-row">
              <input type="checkbox" class="confirm-check" id="equipmentConfirm" />
              <span class="confirm-label">Ознакомлен с разделом</span>
            </label>
          </div>
        </div>
        <div class="page-bottom-spacer"></div>
      </div>
      <div class="sticky-bottom no-print">
        <div class="sticky-bottom-inner">
          <button class="btn btn-secondary" id="slideBack" type="button">← Назад</button>
          <button class="btn btn-primary btn-grow" id="slideNext" type="button" disabled>${index < slides.length - 1 ? 'Следующий раздел →' : 'К завершению →'}</button>
        </div>
      </div>
    `;

    const confirm = document.getElementById('equipmentConfirm');
    const next = document.getElementById('slideNext');
    confirm.addEventListener('change', () => { next.disabled = !confirm.checked; });
    document.getElementById('slideBack').addEventListener('click', () => {
      if (index > 0) renderEquipmentSlide(id, index - 1);
      else renderEquipmentVideo(id);
    });
    next.addEventListener('click', () => {
      if (index < slides.length - 1) renderEquipmentSlide(id, index + 1);
      else renderDone();
    });
    scrollTop();
  }

  function renderDone() {
    const completedAt = new Date();
    const validUntil = addMonths(completedAt, TRAINING_VALIDITY_MONTHS);
    const equipment = state.selectedEquipmentId ? getEquipmentById(state.selectedEquipmentId) : null;

    const record = {
      id: `OT-${Date.now()}`,
      completedAt: completedAt.toISOString(),
      validUntil: validUntil.toISOString(),
      validityMonths: TRAINING_VALIDITY_MONTHS,
      department: 'Участок ЭИП ОМД',
      equipmentId: equipment?.id || null,
      equipmentName: equipment?.name || 'Не выбрана',
      instruction: equipment?.instruction || '',
      status: 'valid'
    };
    saveTrainingRecord(record);

    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: 'Завершено' }
    ]);

    app.innerHTML = `
      <div class="page">
        <div class="done-hero">
          <div class="done-hero-ring">✓</div>
          <div class="done-hero-title">Модуль завершён</div>
          <div class="done-hero-sub">Обучение действительно 3 месяца. Повторное прохождение нужно до ${formatDate(validUntil)}.</div>
        </div>
        <div class="receipt-card">
          <div class="receipt-row"><span class="receipt-key">Статус</span><span class="receipt-val">Действует</span></div>
          <div class="receipt-row"><span class="receipt-key">Установка</span><span class="receipt-val">${esc(record.equipmentName)}</span></div>
          <div class="receipt-row"><span class="receipt-key">Дата прохождения</span><span class="receipt-val">${formatDate(completedAt)}</span></div>
          <div class="receipt-row"><span class="receipt-key">Действует до</span><span class="receipt-val">${formatDate(validUntil)}</span></div>
          <div class="receipt-row"><span class="receipt-key">Периодичность</span><span class="receipt-val">1 раз в 3 месяца</span></div>
          <div class="receipt-row"><span class="receipt-key">Журнал</span><span class="receipt-val">Запись сохранена локально</span></div>
        </div>
        <div class="info-box">На следующем этапе добавим ввод ФИО сотрудника и отправку записи в Google Sheets / журнал прохождения.</div>
        <div class="page-bottom-spacer"></div>
      </div>
      <div class="sticky-bottom no-print">
        <div class="sticky-bottom-inner">
          <button class="btn btn-primary btn-full" id="homeBtn" type="button">На главную</button>
        </div>
      </div>
    `;

    document.getElementById('homeBtn').addEventListener('click', renderHome);
    scrollTop();
  }

  function init() {
    updateDate();
    setInterval(updateDate, 60000);
    renderHome();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
