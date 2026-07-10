(() => {
  'use strict';

  const TRAINING_VALIDITY_MONTHS = 3;
  const GUEST_VALIDITY_DAYS = 1;
  const STORAGE_KEY = 'ot_training_records_v1';
  const DEPARTMENT_LABEL = 'Отдел бесшовных труб';

  const state = {
    mode: 'home',
    commonSlide: 0,
    guestSlide: 0,
    selectedEquipmentId: null,
    equipmentSlide: 0,
    knowledgeAnswers: {},
    employee: {
      fullName: '',
      personnelNumber: '',
      position: ''
    }
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
    if (Number.isNaN(d.getTime())) return 'не указана';
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  }

  function addMonths(date, months) {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== day) d.setDate(0);
    return d;
  }

  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function getEquipmentById(id) {
    return window.OMD_EQUIPMENT.find((item) => item.id === id);
  }

  function getEquipmentVideo(equipment) {
    if (!equipment) return null;
    const video = equipment.video || {};
    const src = video.src || equipment.videoSrc || '';
    if (!src) return null;
    return {
      title: video.title || `${equipment.name}: принцип работы установки`,
      description: video.description || equipment.description || 'Перед инструктажем посмотрите принцип работы и основные опасные зоны установки.',
      duration: video.duration || '',
      src,
      poster: video.poster || '',
      keyPoints: Array.isArray(video.keyPoints) ? video.keyPoints : []
    };
  }

  function hasEquipmentVideo(equipment) {
    return Boolean(getEquipmentVideo(equipment));
  }

  function getEquipmentStepTotal(equipment) {
    const slideCount = equipment?.slides?.length || 0;
    const testCount = equipment?.test?.length ? 1 : 0;
    const videoCount = hasEquipmentVideo(equipment) ? 1 : 0;
    return slideCount + testCount + videoCount;
  }

  function getEquipmentSlideStep(equipment, index) {
    return index + 1 + (hasEquipmentVideo(equipment) ? 1 : 0);
  }

  function renderEquipmentEntry(id) {
    const equipment = getEquipmentById(id);
    state.selectedEquipmentId = id;
    state.equipmentSlide = 0;
    if (hasEquipmentVideo(equipment)) renderEquipmentVideo(id);
    else renderEquipmentSlide(id, 0);
  }

  function getTrainingRecords() {
    try {
      const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(records) ? records : [];
    } catch (error) {
      console.warn('Не удалось прочитать локальный журнал', error);
      return [];
    }
  }

  function saveTrainingRecord(record) {
    const records = getTrainingRecords();
    records.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 50)));
  }

  function clearTrainingRecords() {
    localStorage.removeItem(STORAGE_KEY);
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

  function cardsByType(slide, type) {
    return (slide.cards || []).filter((card) => card.type === type);
  }

  function firstCard(slide, types) {
    return types.map((type) => cardsByType(slide, type)[0]).find(Boolean) || (slide.cards || [])[0];
  }

  function summaryText(card) {
    if (!card) return '';
    return card.sub || card.title || '';
  }

  function renderSummaryPill(tone, label, card, fallback) {
    const title = card?.title || fallback;
    const text = summaryText(card) || fallback;
    return `
      <article class="slide-summary-pill ${tone}">
        <span>${esc(label)}</span>
        <strong>${esc(title)}</strong>
        <p>${esc(text)}</p>
      </article>
    `;
  }

  function renderActionPath(slide) {
    const hasPpe = (slide.cards || []).some((card) => `${card.title} ${card.sub}`.toLowerCase().includes('сиз'));
    const hasElectric = (slide.cards || []).some((card) => `${card.title} ${card.sub}`.toLowerCase().includes('элект'));
    const firstStep = hasPpe ? 'Надень СИЗ' : hasElectric ? 'Проверь питание' : 'Проверь условия';
    const secondStep = firstCard(slide, ['rule', 'ok'])?.title || 'Действуй по заданию';
    const thirdStep = firstCard(slide, ['ban', 'warn']) ? 'Стоп при отклонениях' : 'Сообщи замечания';

    return `
      <div class="slide-action-path" aria-label="Порядок действий">
        <span><b>1</b>${esc(firstStep)}</span>
        <span><b>2</b>${esc(secondStep)}</span>
        <span><b>3</b>${esc(thirdStep)}</span>
      </div>
    `;
  }

  function renderSlideSummary(slide) {
    const required = firstCard(slide, ['rule', 'ok']);
    const forbidden = firstCard(slide, ['ban']);
    const risk = firstCard(slide, ['warn']);

    return `
      <section class="slide-summary-grid" aria-label="Краткий итог раздела">
        ${renderSummaryPill('must', 'Обязательно', required, 'Выполнять только по правилам раздела')}
        ${renderSummaryPill('risk', 'Риск', risk || forbidden, 'Остановиться при опасной ситуации')}
        ${renderSummaryPill('ban', 'Запрещено', forbidden, 'Не выполнять опасные действия')}
      </section>
      ${renderActionPath(slide)}
    `;
  }

  function buildKnowledgeCheck(slide) {
    if (slide.check) return slide.check;

    const forbidden = firstCard(slide, ['ban']);
    if (forbidden) {
      return {
        question: 'Какое действие здесь недопустимо?',
        options: [
          `Не выполнять: ${forbidden.title}. ${forbidden.sub}`,
          'Продолжить работу без проверки зоны',
          'Снять СИЗ для удобства',
          'Не сообщать руководителю о риске'
        ],
        answer: 0,
        feedback: 'Запрещенные действия останавливают работу до устранения риска.'
      };
    }

    const risk = firstCard(slide, ['warn']);
    if (risk) {
      return {
        question: 'Что нужно сделать при таком риске?',
        options: [
          `Остановиться и учесть риск: ${risk.title}. ${risk.sub}`,
          'Ускорить операцию',
          'Передать управление посетителю',
          'Игнорировать предупреждение'
        ],
        answer: 0,
        feedback: 'Риск требует контроля, безопасной дистанции и сообщения ответственному при отклонениях.'
      };
    }

    const required = firstCard(slide, ['rule', 'ok']);
    return {
      question: 'Какой главный акцент раздела?',
      options: [
        `Выполнить: ${required?.title || 'правило раздела'}. ${required?.sub || 'Следовать требованиям раздела'}`,
        'Начать работу без задания',
        'Пропустить проверку перед запуском',
        'Войти в опасную зону без разрешения'
      ],
      answer: 0,
      feedback: 'Главное правило нужно выполнить до перехода к следующему шагу.'
    };
  }

  function renderKnowledgeCheck(slide, checkKey) {
    const check = buildKnowledgeCheck(slide);
    const selected = state.knowledgeAnswers[checkKey];
    const correctText = check.options[check.answer] || '';
    const answered = selected !== undefined;

    return `
      <section class="knowledge-check ${answered ? 'answered' : ''}" data-check-key="${esc(checkKey)}" data-answer="${check.answer}" data-feedback="${esc(check.feedback)}" data-correct-text="${esc(correctText)}">
        <div class="knowledge-check-head">
          <span class="badge badge-blue">Проверка знаний</span>
          <strong>${esc(check.question)}</strong>
        </div>
        <div class="knowledge-options">
          ${check.options.map((option, index) => `
            <button class="knowledge-option ${selected === index ? 'selected' : ''} ${answered && index === check.answer ? 'right' : ''} ${selected === index && index !== check.answer ? 'wrong' : ''}" type="button" data-check-value="${index}">
              ${esc(option)}
            </button>
          `).join('')}
        </div>
        <p class="knowledge-feedback" data-check-feedback ${answered ? '' : 'hidden'}>
          ${answered ? esc(selected === check.answer ? check.feedback : `Верный акцент: ${correctText}. ${check.feedback}`) : ''}
        </p>
      </section>
    `;
  }

  function updateSlideNext(confirm, next, checkKey) {
    next.disabled = !confirm.checked || state.knowledgeAnswers[checkKey] === undefined;
  }

  function bindKnowledgeCheck(section, checkKey, syncNext) {
    if (!section) return;
    const answer = Number(section.dataset.answer);
    const feedback = section.dataset.feedback || '';
    const correctText = section.dataset.correctText || '';
    const feedbackNode = section.querySelector('[data-check-feedback]');

    section.querySelectorAll('[data-check-value]').forEach((button) => {
      button.addEventListener('click', () => {
        const value = Number(button.dataset.checkValue);
        state.knowledgeAnswers[checkKey] = value;
        section.classList.add('answered');

        section.querySelectorAll('[data-check-value]').forEach((item) => {
          const itemValue = Number(item.dataset.checkValue);
          item.classList.toggle('selected', itemValue === value);
          item.classList.toggle('right', itemValue === answer);
          item.classList.toggle('wrong', itemValue === value && value !== answer);
        });

        feedbackNode.hidden = false;
        feedbackNode.textContent = value === answer ? feedback : `Верный акцент: ${correctText}. ${feedback}`;
        syncNext();
      });
    });
  }

  function bindSlideControls({ confirmId, nextId, checkKey }) {
    const confirm = document.getElementById(confirmId);
    const next = document.getElementById(nextId);
    const syncNext = () => updateSlideNext(confirm, next, checkKey);

    confirm.addEventListener('change', syncNext);
    bindKnowledgeCheck(app.querySelector(`[data-check-key="${checkKey}"]`), checkKey, syncNext);
    syncNext();

    return { confirm, next };
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

    const recordsCount = getTrainingRecords().length;

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
          <button class="btn btn-secondary btn-full mt-12" id="guestBtn" type="button">
            Вводный инструктаж для посетителей
          </button>
          <button class="btn btn-secondary btn-full mt-12" id="journalBtn" type="button">
            Журнал прохождения${recordsCount ? ` · ${recordsCount}` : ''}
          </button>
        </section>

        <section class="home-route-card">
          <div class="home-section-title">Маршрут прохождения</div>
          <div class="home-route-timeline">
            <div class="home-route-step active">
              <span>1</span>
              <div><strong>Идентификация</strong><p>Сотрудник вводит ФИО перед началом обучения</p></div>
            </div>
            <div class="home-route-step">
              <span>2</span>
              <div><strong>Подразделение</strong><p>Выбор участка, сектора или лаборатории</p></div>
            </div>
            <div class="home-route-step">
              <span>3</span>
              <div><strong>Установка</strong><p>Видео, опасные зоны и порядок работы</p></div>
            </div>
            <div class="home-route-step">
              <span>4</span>
              <div><strong>Результат</strong><p>Фиксация сотрудника, даты и срока действия 3 месяца</p></div>
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

    document.getElementById('employeeBtn').addEventListener('click', renderEmployeeForm);
    document.getElementById('guestBtn').addEventListener('click', renderGuestForm);
    document.getElementById('journalBtn').addEventListener('click', renderJournal);
    scrollTop();
  }

  function renderEmployeeForm() {
    state.mode = 'employee-form';
    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: 'Идентификация' }
    ]);

    app.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="page-head-eyebrow">Перед обучением</div>
          <div class="page-head-title">Кто проходит инструктаж?</div>
          <div class="page-head-sub">Введите данные сотрудника. Они будут сохранены в журнале прохождения.</div>
        </div>

        <div class="form-block">
          <div class="form-block-title">Данные сотрудника</div>
          <div class="form-group">
            <label class="form-label" for="employeeName">ФИО <span class="req">*</span></label>
            <input class="form-input" id="employeeName" type="text" placeholder="Например: Иванов Иван Иванович" autocomplete="name" value="${esc(state.employee.fullName)}" />
            <div class="form-hint" id="employeeNameHint">Обязательное поле для записи в журнал.</div>
          </div>
          <div class="form-group">
            <label class="form-label" for="employeeNumber">Табельный номер</label>
            <input class="form-input" id="employeeNumber" type="text" placeholder="Можно оставить пустым" value="${esc(state.employee.personnelNumber)}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="employeePosition">Должность / подразделение</label>
            <input class="form-input" id="employeePosition" type="text" placeholder="Например: инженер, отдел бесшовных труб" value="${esc(state.employee.position)}" />
          </div>
        </div>

        <div class="info-box">На первом этапе данные сохраняются локально в браузере. Позже подключим отправку в Google Sheets / журнал.</div>
        <div class="page-bottom-spacer"></div>
      </div>
      <div class="sticky-bottom no-print">
        <div class="sticky-bottom-inner">
          <button class="btn btn-secondary" id="employeeFormBack" type="button">← Назад</button>
          <button class="btn btn-primary btn-grow" id="employeeFormNext" type="button">Продолжить →</button>
        </div>
      </div>
    `;

    document.getElementById('employeeFormBack').addEventListener('click', renderHome);
    document.getElementById('employeeFormNext').addEventListener('click', () => {
      const nameInput = document.getElementById('employeeName');
      const hint = document.getElementById('employeeNameHint');
      const fullName = nameInput.value.trim();

      if (!fullName) {
        nameInput.classList.add('err');
        hint.classList.add('err');
        hint.textContent = 'Введите ФИО сотрудника.';
        nameInput.focus();
        return;
      }

      state.employee.fullName = fullName;
      state.employee.personnelNumber = document.getElementById('employeeNumber').value.trim();
      state.employee.position = document.getElementById('employeePosition').value.trim();
      renderDepartments();
    });
    scrollTop();
  }

  function renderGuestForm() {
    state.mode = 'guest-form';
    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: 'Вводный инструктаж' }
    ]);

    app.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="page-head-eyebrow">Командированные и посетители</div>
          <div class="page-head-title">Кто проходит вводный инструктаж?</div>
          <div class="page-head-sub">Введите данные посетителя или командированного сотрудника. Запись будет сохранена в локальном журнале.</div>
        </div>

        <div class="form-block">
          <div class="form-block-title">Данные участника</div>
          <div class="form-group">
            <label class="form-label" for="guestName">ФИО <span class="req">*</span></label>
            <input class="form-input" id="guestName" type="text" placeholder="Например: Иванов Иван Иванович" autocomplete="name" value="${esc(state.employee.fullName)}" />
            <div class="form-hint" id="guestNameHint">Обязательное поле для записи в журнал.</div>
          </div>
          <div class="form-group">
            <label class="form-label" for="guestNumber">Организация / табельный номер</label>
            <input class="form-input" id="guestNumber" type="text" placeholder="Можно оставить пустым" value="${esc(state.employee.personnelNumber)}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="guestPosition">Должность / цель посещения</label>
            <input class="form-input" id="guestPosition" type="text" placeholder="Например: представитель подрядчика" value="${esc(state.employee.position)}" />
          </div>
        </div>

        <div class="info-box">Вводный инструктаж нужен перед нахождением на территории и в производственных помещениях.</div>
        <div class="page-bottom-spacer"></div>
      </div>
      <div class="sticky-bottom no-print">
        <div class="sticky-bottom-inner">
          <button class="btn btn-secondary" id="guestFormBack" type="button">← Назад</button>
          <button class="btn btn-primary btn-grow" id="guestFormNext" type="button">Продолжить →</button>
        </div>
      </div>
    `;

    document.getElementById('guestFormBack').addEventListener('click', renderHome);
    document.getElementById('guestFormNext').addEventListener('click', () => {
      const nameInput = document.getElementById('guestName');
      const hint = document.getElementById('guestNameHint');
      const fullName = nameInput.value.trim();

      if (!fullName) {
        nameInput.classList.add('err');
        hint.classList.add('err');
        hint.textContent = 'Введите ФИО участника инструктажа.';
        nameInput.focus();
        return;
      }

      state.employee.fullName = fullName;
      state.employee.personnelNumber = document.getElementById('guestNumber').value.trim();
      state.employee.position = document.getElementById('guestPosition').value.trim();
      renderGuestIntro(0);
    });
    scrollTop();
  }

  function renderJournal() {
    const records = getTrainingRecords();
    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: 'Журнал' }
    ]);

    const content = records.length ? records.map((record) => {
      const isGuestRecord = record.moduleType === 'guest' || record.equipmentId === 'guest-intro';
      const expired = record.validUntil ? new Date(record.validUntil) < new Date() : false;
      return `
        <div class="receipt-card">
          <div class="receipt-row"><span class="receipt-key">Сотрудник</span><span class="receipt-val">${esc(record.employeeName || 'Не указан')}</span></div>
          <div class="receipt-row"><span class="receipt-key">${isGuestRecord ? 'Инструктаж' : 'Установка'}</span><span class="receipt-val">${esc(record.equipmentName || 'Не выбрана')}</span></div>
          <div class="receipt-row"><span class="receipt-key">Пройдено</span><span class="receipt-val">${formatDate(record.completedAt)}</span></div>
          <div class="receipt-row"><span class="receipt-key">Действует до</span><span class="receipt-val">${formatDate(record.validUntil)}</span></div>
          <div class="receipt-row"><span class="receipt-key">Срок</span><span class="receipt-val">${esc(record.validityLabel || `${record.validityMonths || TRAINING_VALIDITY_MONTHS} месяца`)}</span></div>
          <div class="receipt-row"><span class="receipt-key">Статус</span><span class="receipt-val">${expired ? 'Требуется повторить' : 'Действует'}</span></div>
        </div>
      `;
    }).join('') : '<div class="info-box">Пока нет записей. Пройдите обучение, чтобы запись появилась в журнале.</div>';

    app.innerHTML = `
      <div class="page">
          <div class="page-head">
            <div class="page-head-eyebrow">Журнал прохождения</div>
            <div class="page-head-title">Кто прошёл инструктаж</div>
          <div class="page-head-sub">Здесь отображаются локально сохраненные записи. Для сотрудников обучение действует 3 месяца, вводный инструктаж посетителей фиксируется отдельно.</div>
        </div>
        ${content}
        ${records.length ? '<button class="btn btn-secondary btn-full mt-16" id="journalClear" type="button">Очистить локальный журнал</button>' : ''}
        <div class="page-bottom-spacer"></div>
      </div>
      <div class="sticky-bottom no-print">
        <div class="sticky-bottom-inner">
          <button class="btn btn-secondary" id="journalBack" type="button">← Главная</button>
          <button class="btn btn-primary btn-grow" id="journalStart" type="button">Новое обучение</button>
        </div>
      </div>
    `;

    document.getElementById('journalBack').addEventListener('click', renderHome);
    document.getElementById('journalStart').addEventListener('click', renderEmployeeForm);
    const clearBtn = document.getElementById('journalClear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (!window.confirm('Удалить все локальные записи журнала?')) return;
        clearTrainingRecords();
        renderJournal();
      });
    }
    scrollTop();
  }

  function renderGuestIntro(index = 0) {
    state.mode = 'guest-intro';
    state.guestSlide = index;
    const slides = window.GUEST_INTRO || [];
    const slide = slides[index];
    const total = slides.length;
    const checkKey = `guest:${index}`;

    if (!slide) {
      renderDone({ type: 'guest' });
      return;
    }

    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: 'Вводный инструктаж', onClick: renderGuestForm },
      { label: `Раздел ${index + 1}` }
    ]);

    app.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="page-head-eyebrow">Посетитель: ${esc(state.employee.fullName || 'не указан')}</div>
          <div class="page-head-title">${esc(slide.title)}</div>
          <div class="page-head-sub">Ключевые правила нахождения на территории, движения по маршрутам и запрета самостоятельного управления оборудованием.</div>
        </div>
        ${renderStepper({ current: index + 1, total, label: `Раздел ${index + 1} из ${total}` })}
        <div class="slide-block">
          <div class="slide-block-head">
            <div class="slide-block-num">${index + 1}</div>
            <div class="slide-block-title">${esc(slide.title)}</div>
          </div>
          ${renderSlideSummary(slide)}
          <div class="slide-cards-grid">${slide.cards.map(renderSafetyCard).join('')}</div>
          ${renderKnowledgeCheck(slide, checkKey)}
          <div class="slide-footer">
            <label class="confirm-row">
              <input type="checkbox" class="confirm-check" id="guestConfirm" />
              <span class="confirm-label">Понял правила раздела</span>
            </label>
          </div>
        </div>
        <div class="page-bottom-spacer"></div>
      </div>
      <div class="sticky-bottom no-print">
        <div class="sticky-bottom-inner">
          <button class="btn btn-secondary" id="guestBack" type="button">← Назад</button>
          <button class="btn btn-primary btn-grow" id="guestNext" type="button" disabled>${index < total - 1 ? 'Следующий раздел →' : 'Завершить →'}</button>
        </div>
      </div>
    `;

    const { next } = bindSlideControls({ confirmId: 'guestConfirm', nextId: 'guestNext', checkKey });
    document.getElementById('guestBack').addEventListener('click', () => {
      if (index > 0) renderGuestIntro(index - 1);
      else renderGuestForm();
    });
    next.addEventListener('click', () => {
      if (index < total - 1) renderGuestIntro(index + 1);
      else renderDone({ type: 'guest' });
    });
    scrollTop();
  }

  function renderDepartments() {
    state.mode = 'departments';
    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: state.employee.fullName || 'Сотрудник' }
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
          <div class="page-head-eyebrow">Сотрудник: ${esc(state.employee.fullName || 'не указан')}</div>
          <div class="page-head-title">Выберите подразделение</div>
          <div class="page-head-sub">Пока подробно прорабатываем отдел бесшовных труб. Остальные направления уже заложены в структуру.</div>
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
      { label: 'Подразделения', onClick: renderDepartments },
      { label: dept.shortName }
    ]);

    app.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="page-head-eyebrow">Раздел в структуре</div>
          <div class="page-head-title">${esc(dept.name)}</div>
          <div class="page-head-sub">Этот раздел будет наполнен после отработки эталонного сценария отдела бесшовных труб.</div>
        </div>
        <div class="info-box">Сначала доводим до качества пилотный маршрут: общий модуль → установки → видео или слайды → тест. Потом масштабируем на остальные направления.</div>
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
    const checkKey = `omd:${index}`;

    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: 'Подразделения', onClick: renderDepartments },
      { label: DEPARTMENT_LABEL },
      { label: `Раздел ${index + 1}` }
    ]);

    app.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="page-head-eyebrow">${esc(DEPARTMENT_LABEL)} · ${esc(state.employee.fullName || 'сотрудник')}</div>
          <div class="page-head-title">${esc(slide.title)}</div>
          <div class="page-head-sub">${esc(module.subtitle)}</div>
        </div>
        ${renderStepper({ current: index + 1, total, label: `Раздел ${index + 1} из ${total}` })}
        <div class="slide-block">
          <div class="slide-block-head">
            <div class="slide-block-num">${index + 1}</div>
            <div class="slide-block-title">${esc(slide.title)}</div>
          </div>
          ${renderSlideSummary(slide)}
          <div class="slide-cards-grid">${slide.cards.map(renderSafetyCard).join('')}</div>
          ${renderKnowledgeCheck(slide, checkKey)}
          <div class="slide-footer">
            <label class="confirm-row">
              <input type="checkbox" class="confirm-check" id="omdConfirm" />
              <span class="confirm-label">Понял правила раздела</span>
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

    const { next } = bindSlideControls({ confirmId: 'omdConfirm', nextId: 'omdNext', checkKey });
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
      { label: 'Подразделения', onClick: renderDepartments },
      { label: DEPARTMENT_LABEL, onClick: () => renderOmdCommon(0) },
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
              <span class="badge badge-gray">${equipment.videoSrc ? esc(equipment.video?.duration || 'видео') : 'слайды + тест'}</span>
              <span class="badge badge-green">срок 3 месяца</span>
            </div>
          </div>
        </div>
      </button>
    `).join('');

    app.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="page-head-eyebrow">Отдел бесшовных труб · ${esc(state.employee.fullName || 'сотрудник')}</div>
          <div class="page-head-title">Выберите установку</div>
          <div class="page-head-sub">После выбора установки откроются нюансы ИОТ, а для ЭУ-ПППТ сначала будет показано видео принципа работы.</div>
        </div>
        <div class="list-stack">${items}</div>
        <div class="page-bottom-spacer"></div>
      </div>
    `;

    app.querySelectorAll('[data-equipment]').forEach((btn) => {
      btn.addEventListener('click', () => renderEquipmentEntry(btn.dataset.equipment));
    });
    scrollTop();
  }

  function renderEquipmentVideo(id) {
    const equipment = getEquipmentById(id);
    const video = getEquipmentVideo(equipment);
    state.selectedEquipmentId = id;
    state.equipmentSlide = 0;

    if (!video) {
      renderEquipmentSlide(id, 0);
      return;
    }

    const total = getEquipmentStepTotal(equipment);
    const posterAttr = video.poster ? ` poster="${esc(video.poster)}"` : '';
    const keyPoints = video.keyPoints.length ? video.keyPoints : ['Назначение установки', 'Опасные зоны', 'Пульт управления', 'Безопасная позиция'];

    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: DEPARTMENT_LABEL, onClick: () => renderOmdCommon(0) },
      { label: 'Установки', onClick: renderEquipmentList },
      { label: equipment.name }
    ]);

    app.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="page-head-eyebrow">${esc(equipment.instruction)}</div>
          <div class="page-head-title">${esc(video.title)}</div>
          <div class="page-head-sub">${esc(video.description)}</div>
        </div>
        ${renderStepper({ current: 1, total, label: `Шаг 1 из ${total} — видео по установке` })}
        <div class="slide-block training-video-block">
          <div class="slide-block-head">
            <div class="slide-block-num">▶</div>
            <div class="slide-block-title">Принцип работы установки</div>
          </div>
          <div class="training-video-body">
            <div class="training-video-frame">
              <video controls playsinline preload="metadata"${posterAttr}>
                <source src="${esc(video.src)}" type="video/mp4" />
                Ваш браузер не поддерживает видео.
              </video>
            </div>
            <div class="training-video-meta">
              <span class="badge badge-blue">Видео ${esc(video.duration || 'по установке')}</span>
              <p>${esc(video.description)}</p>
              <div class="video-preflight-grid">
                ${keyPoints.map((point) => `
                  <article>
                    <span class="badge badge-gray">Ключевой блок</span>
                    <strong>${esc(point)}</strong>
                    <p>Отметьте этот элемент в ролике перед переходом к правилам.</p>
                  </article>
                `).join('')}
              </div>
              <button class="vp-play-btn" id="equipmentCardsBtn" type="button">Далее к правилам</button>
            </div>
          </div>
        </div>
        <div class="page-bottom-spacer"></div>
      </div>
      <div class="sticky-bottom no-print">
        <div class="sticky-bottom-inner">
          <button class="btn btn-secondary" id="equipmentBack" type="button">← Установки</button>
          <button class="btn btn-primary btn-grow" id="equipmentNext" type="button">Далее к правилам →</button>
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
    const total = getEquipmentStepTotal(equipment);
    const stepNumber = getEquipmentSlideStep(equipment, index);
    const checkKey = `equipment:${id}:${index}`;
    state.selectedEquipmentId = id;
    state.equipmentSlide = index;

    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: DEPARTMENT_LABEL, onClick: () => renderOmdCommon(0) },
      { label: 'Установки', onClick: renderEquipmentList },
      { label: equipment.name, onClick: () => renderEquipmentEntry(id) },
      { label: `Раздел ${index + 1}` }
    ]);

    app.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="page-head-eyebrow">Инструктаж по установке · ${esc(state.employee.fullName || 'сотрудник')}</div>
          <div class="page-head-title">${esc(slide.title)}</div>
          <div class="page-head-sub">${esc(equipment.name)}</div>
        </div>
        ${renderStepper({ current: stepNumber, total, label: `Шаг ${stepNumber} из ${total} — ${slide.title}` })}
        <div class="slide-block">
          <div class="slide-block-head">
            <div class="slide-block-num">${index + 1}</div>
            <div class="slide-block-title">${esc(slide.title)}</div>
          </div>
          ${renderSlideSummary(slide)}
          <div class="slide-cards-grid">${slide.cards.map(renderSafetyCard).join('')}</div>
          ${renderKnowledgeCheck(slide, checkKey)}
          <div class="slide-footer">
            <label class="confirm-row">
              <input type="checkbox" class="confirm-check" id="equipmentConfirm" />
              <span class="confirm-label">Понял правила раздела</span>
            </label>
          </div>
        </div>
        <div class="page-bottom-spacer"></div>
      </div>
      <div class="sticky-bottom no-print">
        <div class="sticky-bottom-inner">
          <button class="btn btn-secondary" id="slideBack" type="button">← Назад</button>
          <button class="btn btn-primary btn-grow" id="slideNext" type="button" disabled>${index < slides.length - 1 ? 'Следующий раздел →' : equipment.test?.length ? 'К тесту →' : 'К завершению →'}</button>
        </div>
      </div>
    `;

    const { next } = bindSlideControls({ confirmId: 'equipmentConfirm', nextId: 'slideNext', checkKey });
    document.getElementById('slideBack').addEventListener('click', () => {
      if (index > 0) renderEquipmentSlide(id, index - 1);
      else if (hasEquipmentVideo(equipment)) renderEquipmentVideo(id);
      else renderEquipmentList();
    });
    next.addEventListener('click', () => {
      if (index < slides.length - 1) renderEquipmentSlide(id, index + 1);
      else if (equipment.test?.length) renderEquipmentTest(id);
      else renderDone();
    });
    scrollTop();
  }

  function renderEquipmentTest(id) {
    const equipment = getEquipmentById(id);
    const questions = equipment.test || [];
    if (!questions.length) {
      renderDone();
      return;
    }

    const total = getEquipmentStepTotal(equipment);
    const answeredCount = questions.filter((_, index) => state.knowledgeAnswers[`test:${id}:${index}`] !== undefined).length;
    const correctCount = questions.filter((question, index) => state.knowledgeAnswers[`test:${id}:${index}`] === question.answer).length;
    const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 100;
    const passScore = equipment.passScore || 80;

    setBreadcrumb([
      { label: 'Главная', onClick: renderHome },
      { label: DEPARTMENT_LABEL, onClick: () => renderOmdCommon(0) },
      { label: 'Установки', onClick: renderEquipmentList },
      { label: equipment.name, onClick: () => renderEquipmentEntry(id) },
      { label: 'Тест' }
    ]);

    app.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="page-head-eyebrow">Проверка знаний · ${esc(equipment.instruction)}</div>
          <div class="page-head-title">Итоговый тест по установке</div>
          <div class="page-head-sub">Ответьте на вопросы по общим требованиям и нюансам ${esc(equipment.name)}.</div>
        </div>
        ${renderStepper({ current: total, total, label: `Шаг ${total} из ${total} — тест` })}
        <div class="slide-block">
          <div class="slide-block-head">
            <div class="slide-block-num">?</div>
            <div class="slide-block-title">Проверка перед завершением</div>
          </div>
          <div class="test-summary-row">
            <span class="badge badge-blue">Вопросы: ${questions.length}</span>
            <span class="badge badge-green">Порог: ${passScore}%</span>
            <span class="badge badge-gray" id="testScore">Отвечено: ${answeredCount}/${questions.length}</span>
          </div>
          <div class="test-question-list">
            ${questions.map((question, index) => {
              const key = `test:${id}:${index}`;
              const selected = state.knowledgeAnswers[key];
              const correctText = question.options[question.answer] || '';
              const answered = selected !== undefined;
              return `
                <section class="knowledge-check ${answered ? 'answered' : ''}" data-test-key="${esc(key)}" data-answer="${question.answer}" data-feedback="${esc(question.feedback)}" data-correct-text="${esc(correctText)}">
                  <div class="knowledge-check-head">
                    <span class="badge badge-blue">${index + 1}</span>
                    <strong>${esc(question.question)}</strong>
                  </div>
                  <div class="knowledge-options">
                    ${question.options.map((option, optionIndex) => `
                      <button class="knowledge-option ${selected === optionIndex ? 'selected' : ''} ${answered && optionIndex === question.answer ? 'right' : ''} ${selected === optionIndex && optionIndex !== question.answer ? 'wrong' : ''}" type="button" data-test-value="${optionIndex}">
                        ${esc(option)}
                      </button>
                    `).join('')}
                  </div>
                  <p class="knowledge-feedback" data-check-feedback ${answered ? '' : 'hidden'}>
                    ${answered ? esc(selected === question.answer ? question.feedback : `Верный акцент: ${correctText}. ${question.feedback}`) : ''}
                  </p>
                </section>
              `;
            }).join('')}
          </div>
        </div>
        <div class="page-bottom-spacer"></div>
      </div>
      <div class="sticky-bottom no-print">
        <div class="sticky-bottom-inner">
          <button class="btn btn-secondary" id="testBack" type="button">← Назад</button>
          <button class="btn btn-primary btn-grow" id="testNext" type="button" disabled>Завершить инструктаж →</button>
        </div>
      </div>
    `;

    bindEquipmentTest(id);
    document.getElementById('testBack').addEventListener('click', () => renderEquipmentSlide(id, (equipment.slides || []).length - 1));
    document.getElementById('testNext').addEventListener('click', () => renderDone());
    scrollTop();
  }

  function bindEquipmentTest(id) {
    const equipment = getEquipmentById(id);
    const questions = equipment.test || [];
    const next = document.getElementById('testNext');
    const scoreNode = document.getElementById('testScore');

    const sync = () => {
      const answeredCount = questions.filter((_, index) => state.knowledgeAnswers[`test:${id}:${index}`] !== undefined).length;
      const correctCount = questions.filter((question, index) => state.knowledgeAnswers[`test:${id}:${index}`] === question.answer).length;
      const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 100;
      next.disabled = answeredCount < questions.length;
      scoreNode.textContent = answeredCount === questions.length ? `Результат: ${score}%` : `Отвечено: ${answeredCount}/${questions.length}`;
      scoreNode.className = `badge ${answeredCount === questions.length && score >= (equipment.passScore || 80) ? 'badge-green' : 'badge-gray'}`;
    };

    app.querySelectorAll('[data-test-key]').forEach((section) => {
      const key = section.dataset.testKey;
      const answer = Number(section.dataset.answer);
      const feedback = section.dataset.feedback || '';
      const correctText = section.dataset.correctText || '';
      const feedbackNode = section.querySelector('[data-check-feedback]');

      section.querySelectorAll('[data-test-value]').forEach((button) => {
        button.addEventListener('click', () => {
          const value = Number(button.dataset.testValue);
          state.knowledgeAnswers[key] = value;
          section.classList.add('answered');

          section.querySelectorAll('[data-test-value]').forEach((item) => {
            const itemValue = Number(item.dataset.testValue);
            item.classList.toggle('selected', itemValue === value);
            item.classList.toggle('right', itemValue === answer);
            item.classList.toggle('wrong', itemValue === value && value !== answer);
          });

          feedbackNode.hidden = false;
          feedbackNode.textContent = value === answer ? feedback : `Верный акцент: ${correctText}. ${feedback}`;
          sync();
        });
      });
    });

    sync();
  }

  function renderDone(options = {}) {
    const completedAt = new Date();
    const isGuest = options.type === 'guest';
    const validUntil = isGuest ? addDays(completedAt, GUEST_VALIDITY_DAYS) : addMonths(completedAt, TRAINING_VALIDITY_MONTHS);
    const equipment = state.selectedEquipmentId ? getEquipmentById(state.selectedEquipmentId) : null;

    const record = {
      id: `${isGuest ? 'GUEST' : 'OT'}-${Date.now()}`,
      employeeName: state.employee.fullName || 'Не указан',
      personnelNumber: state.employee.personnelNumber || '',
      position: state.employee.position || '',
      completedAt: completedAt.toISOString(),
      validUntil: validUntil.toISOString(),
      validityMonths: isGuest ? 0 : TRAINING_VALIDITY_MONTHS,
      validityLabel: isGuest ? 'на срок посещения' : `${TRAINING_VALIDITY_MONTHS} месяца`,
      moduleType: isGuest ? 'guest' : 'equipment',
      department: isGuest ? 'Командированные и посетители' : DEPARTMENT_LABEL,
      equipmentId: isGuest ? 'guest-intro' : equipment?.id || null,
      equipmentName: isGuest ? 'Вводный инструктаж' : equipment?.name || 'Не выбрана',
      instruction: isGuest ? 'Вводный инструктаж' : equipment?.instruction || '',
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
          <div class="done-hero-title">${isGuest ? 'Вводный инструктаж завершён' : 'Модуль завершён'}</div>
          <div class="done-hero-sub">${isGuest ? `Запись сохранена в журнале. Инструктаж действует до ${formatDate(validUntil)}.` : `Обучение действительно 3 месяца. Повторное прохождение нужно до ${formatDate(validUntil)}.`}</div>
        </div>
        <div class="receipt-card">
          <div class="receipt-row"><span class="receipt-key">Сотрудник</span><span class="receipt-val">${esc(record.employeeName)}</span></div>
          <div class="receipt-row"><span class="receipt-key">Табельный №</span><span class="receipt-val">${esc(record.personnelNumber || 'не указан')}</span></div>
          <div class="receipt-row"><span class="receipt-key">Статус</span><span class="receipt-val">Действует</span></div>
          <div class="receipt-row"><span class="receipt-key">${isGuest ? 'Инструктаж' : 'Установка'}</span><span class="receipt-val">${esc(record.equipmentName)}</span></div>
          <div class="receipt-row"><span class="receipt-key">Дата прохождения</span><span class="receipt-val">${formatDate(completedAt)}</span></div>
          <div class="receipt-row"><span class="receipt-key">Действует до</span><span class="receipt-val">${formatDate(validUntil)}</span></div>
          <div class="receipt-row"><span class="receipt-key">Периодичность</span><span class="receipt-val">${isGuest ? 'на срок посещения' : '1 раз в 3 месяца'}</span></div>
          <div class="receipt-row"><span class="receipt-key">Журнал</span><span class="receipt-val">Запись сохранена локально</span></div>
        </div>
        <div class="info-box">Позже эту запись можно будет автоматически отправлять в Google Sheets / общий журнал прохождения.</div>
        <div class="page-bottom-spacer"></div>
      </div>
      <div class="sticky-bottom no-print">
        <div class="sticky-bottom-inner">
          <button class="btn btn-secondary" id="journalBtnDone" type="button">Журнал</button>
          <button class="btn btn-primary btn-grow" id="homeBtn" type="button">На главную</button>
        </div>
      </div>
    `;

    document.getElementById('homeBtn').addEventListener('click', renderHome);
    document.getElementById('journalBtnDone').addEventListener('click', renderJournal);
    scrollTop();
  }

  function init() {
    updateDate();
    setInterval(updateDate, 60000);
    renderHome();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

