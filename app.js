const screens = [
  {
    kicker: "Старт",
    icon: "🛡️",
    title: "Цифровой инструктаж по охране труда",
    text: "Приложение будет вести сотрудника последовательно: от базовых правил безопасности до обучения по конкретной установке и фиксации результата.",
    items: [
      "Чистый mobile-first интерфейс",
      "Один экран — один смысл",
      "Короткие карточки вместо длинных инструкций",
      "Задел под Telegram WebApp и GitHub Pages"
    ],
    notice: "Основа логики — уже опубликованный формат обучения для командированных: пользователь не видит всё сразу, а проходит маршрут по шагам."
  },
  {
    kicker: "Шаг 1",
    icon: "📘",
    title: "Общий инструктаж для всех",
    text: "Сначала сотрудник изучает базовые требования, которые действуют для всех направлений: допуск, СИЗ, порядок действий при аварии и ответственность.",
    items: [
      "Допуск к работе",
      "Средства индивидуальной защиты",
      "Пожар, травма, электробезопасность",
      "Короткий тест по общим требованиям"
    ]
  },
  {
    kicker: "Шаг 2",
    icon: "🏢",
    title: "Выбор отдела и подразделения",
    text: "После общего блока пользователь выбирает нужное направление: отдел, сектор, лабораторию или участок. У каждого подразделения будет свой общий модуль.",
    items: [
      "Отделы и лаборатории",
      "Секторы и участки",
      "Общие риски конкретного направления",
      "Без дублирования одинаковых требований"
    ]
  },
  {
    kicker: "Шаг 3",
    icon: "⚙️",
    title: "Выбор установки",
    text: "Далее сотрудник выбирает конкретное оборудование, на котором ему предстоит работать. Для каждой установки будет отдельная карточка обучения.",
    items: [
      "Название установки",
      "Подразделение и ответственный",
      "Номер ИОТ при наличии",
      "Основные опасности"
    ]
  },
  {
    kicker: "Шаг 4",
    icon: "▶️",
    title: "Видео по установке",
    text: "Модуль конкретной установки начинается с вводного видео. Пока экран оставляем пустым, позже сюда будет добавлен ролик со сценарием безопасной работы.",
    items: [
      "Пока показываем placeholder",
      "Позже подключаем mp4-файл",
      "Видео адаптируется под телефон",
      "Без autoplay со звуком"
    ],
    notice: "Видео нужно именно для установки: показать пульт, опасные зоны, рабочую сторону, порядок запуска и действия при нештатной ситуации."
  },
  {
    kicker: "Шаг 5",
    icon: "⚠️",
    title: "Инструктаж по установке",
    text: "После видео идут короткие экраны по конкретному оборудованию: опасные зоны, проверка перед началом работы, безопасный порядок действий и запреты.",
    items: [
      "Опасные зоны",
      "Перед началом работы",
      "Безопасный порядок работы",
      "Что запрещено и что делать при аварии"
    ]
  },
  {
    kicker: "Финал",
    icon: "✅",
    title: "Тест и журнал прохождения",
    text: "В конце сотрудник проходит тест. Результат фиксируется в журнале: дата, установка, процент прохождения и статус допуска.",
    items: [
      "Порог прохождения — 80%",
      "Результат: допущен / не допущен",
      "Сохранение в localStorage на первом этапе",
      "Дальше — подключение Google Sheets"
    ],
    notice: "Следующий этап разработки — добавить подробный общий инструктаж участка ЭИП ОМД на 12 экранов."
  }
];

let currentScreen = 0;

const stepLabel = document.getElementById("stepLabel");
const stepPercent = document.getElementById("stepPercent");
const progressFill = document.getElementById("progressFill");
const screenIcon = document.getElementById("screenIcon");
const screenKicker = document.getElementById("screenKicker");
const screenTitle = document.getElementById("screenTitle");
const screenText = document.getElementById("screenText");
const screenList = document.getElementById("screenList");
const screenNotice = document.getElementById("screenNotice");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

function renderScreen() {
  const screen = screens[currentScreen];
  const percent = Math.round(((currentScreen + 1) / screens.length) * 100);

  stepLabel.textContent = `Шаг ${currentScreen + 1} из ${screens.length}`;
  stepPercent.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;

  screenIcon.textContent = screen.icon;
  screenKicker.textContent = screen.kicker;
  screenTitle.textContent = screen.title;
  screenText.textContent = screen.text;

  screenList.innerHTML = "";
  screen.items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `<span>${index + 1}</span><p>${item}</p>`;
    screenList.appendChild(row);
  });

  if (screen.notice) {
    screenNotice.textContent = screen.notice;
    screenNotice.classList.add("show");
  } else {
    screenNotice.textContent = "";
    screenNotice.classList.remove("show");
  }

  prevBtn.disabled = currentScreen === 0;
  nextBtn.textContent = currentScreen === screens.length - 1 ? "Завершить" : "Далее";
}

function nextScreen() {
  if (currentScreen < screens.length - 1) {
    currentScreen += 1;
    renderScreen();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  currentScreen = 0;
  renderScreen();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function prevScreen() {
  if (currentScreen > 0) {
    currentScreen -= 1;
    renderScreen();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

nextBtn.addEventListener("click", nextScreen);
prevBtn.addEventListener("click", prevScreen);

document.addEventListener("DOMContentLoaded", renderScreen);
