const routeSteps = [
  {
    title: "Общий инструктаж",
    description: "Базовые требования безопасности для всех сотрудников.",
    icon: "🛡️"
  },
  {
    title: "Выбор отдела",
    description: "Переход к нужному направлению: лаборатория, участок или сектор.",
    icon: "🏢"
  },
  {
    title: "Выбор подразделения",
    description: "Сектор, лаборатория или участок с собственным общим модулем.",
    icon: "🧭"
  },
  {
    title: "Общий модуль подразделения",
    description: "Повторяющиеся правила и риски конкретного направления.",
    icon: "📋"
  },
  {
    title: "Выбор установки",
    description: "Конкретное оборудование, на котором сотрудник будет работать.",
    icon: "⚙️"
  },
  {
    title: "Видео и инструктаж",
    description: "Видео по установке, опасные зоны, запреты и порядок работы.",
    icon: "▶️"
  },
  {
    title: "Тестирование",
    description: "Проверка знаний и подтверждение допуска к работе.",
    icon: "✅"
  },
  {
    title: "Журнал прохождения",
    description: "Фиксация результата, даты, установки и статуса сотрудника.",
    icon: "📊"
  }
];

const appModules = [
  {
    title: "Для всех сотрудников",
    description: "Единый стартовый модуль: допуск, СИЗ, пожар, травма, электробезопасность.",
    icon: "👥"
  },
  {
    title: "Подразделения",
    description: "Отделы, сектора, лаборатории и участки с отдельными правилами.",
    icon: "🏭"
  },
  {
    title: "Оборудование",
    description: "Каталог установок с карточками, ответственными и типами опасностей.",
    icon: "🛠️"
  },
  {
    title: "Видео по установкам",
    description: "Пока оставляем placeholder, позже подключим реальные ролики.",
    icon: "🎬"
  },
  {
    title: "Тесты",
    description: "Короткие вопросы после общего модуля и по каждой установке.",
    icon: "🧪"
  },
  {
    title: "Журнал",
    description: "Локальное сохранение результата с заделом под Google Sheets.",
    icon: "📒",
    warning: true
  }
];

function createRouteCard(step, index) {
  const card = document.createElement("article");
  card.className = "route-card";
  card.innerHTML = `
    <div class="card-top">
      <span class="card-number">${index + 1}</span>
      <span class="card-icon" aria-hidden="true">${step.icon}</span>
    </div>
    <h3>${step.title}</h3>
    <p>${step.description}</p>
  `;
  return card;
}

function createModuleCard(module) {
  const card = document.createElement("article");
  card.className = `module-card${module.warning ? " warning" : ""}`;
  card.innerHTML = `
    <div class="card-top">
      <span class="card-icon" aria-hidden="true">${module.icon}</span>
    </div>
    <h3>${module.title}</h3>
    <p>${module.description}</p>
  `;
  return card;
}

function renderCards() {
  const routeGrid = document.querySelector("#architecture");
  const moduleGrid = document.querySelector("#modules");

  routeSteps.forEach((step, index) => {
    routeGrid.appendChild(createRouteCard(step, index));
  });

  appModules.forEach((module) => {
    moduleGrid.appendChild(createModuleCard(module));
  });
}

function setupScrollButtons() {
  const buttons = document.querySelectorAll("[data-scroll-to]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-scroll-to");
      const target = document.getElementById(targetId);

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function init() {
  renderCards();
  setupScrollButtons();
}

document.addEventListener("DOMContentLoaded", init);
