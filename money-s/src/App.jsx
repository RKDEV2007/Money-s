import { useState, useEffect, useCallback } from 'react';
import Aurora from './components/Aurora';
import './App.css';

// Простая функция, чтобы красиво выводить рубли
function formatRub(value) {
  return `${Number(value).toLocaleString('ru-RU')} руб.`;
}

function App() {
  // Загрузка данных из localStorage при инициализации
  const loadFromStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // --- Финансовые состояния приложения ---
  // Три "кошелька" + агрегаты по месяцу.
  const [mainBalance, setMainBalance] = useState(() => loadFromStorage('mainBalance', 0));
  const [giftBalance, setGiftBalance] = useState(() => loadFromStorage('giftBalance', 0));
  const [rainyBalance, setRainyBalance] = useState(() => loadFromStorage('rainyBalance', 0));
  const [incomeTotal, setIncomeTotal] = useState(() => loadFromStorage('incomeTotal', 0));
  const [expenseTotal, setExpenseTotal] = useState(() => loadFromStorage('expenseTotal', 0));

  // Настройки процентов для автоматического распределения
  const [giftPercent, setGiftPercent] = useState(() => loadFromStorage('giftPercent', 10));
  const [rainyPercent, setRainyPercent] = useState(() => loadFromStorage('rainyPercent', 10));

  // --- UI-состояния формы и модального окна ---
  // activeModal: '' | 'income' | 'expense' | 'settings'
  const [activeModal, setActiveModal] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePriority, setExpensePriority] = useState('3');
  const [saveToGifts, setSaveToGifts] = useState(true);
  const [saveToRainyDay, setSaveToRainyDay] = useState(true);
  const [expenseSource, setExpenseSource] = useState('main');
  const [error, setError] = useState('');

  // Список пользовательских расходов для карточек "Расходы"
  const [expenseItems, setExpenseItems] = useState(() => loadFromStorage('expenseItems', []));

  // Сохранение данных в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('mainBalance', JSON.stringify(mainBalance));
  }, [mainBalance]);

  useEffect(() => {
    localStorage.setItem('giftBalance', JSON.stringify(giftBalance));
  }, [giftBalance]);

  useEffect(() => {
    localStorage.setItem('rainyBalance', JSON.stringify(rainyBalance));
  }, [rainyBalance]);

  useEffect(() => {
    localStorage.setItem('incomeTotal', JSON.stringify(incomeTotal));
  }, [incomeTotal]);

  useEffect(() => {
    localStorage.setItem('expenseTotal', JSON.stringify(expenseTotal));
  }, [expenseTotal]);

  useEffect(() => {
    localStorage.setItem('expenseItems', JSON.stringify(expenseItems));
  }, [expenseItems]);

  useEffect(() => {
    localStorage.setItem('giftPercent', JSON.stringify(giftPercent));
  }, [giftPercent]);

  useEffect(() => {
    localStorage.setItem('rainyPercent', JSON.stringify(rainyPercent));
  }, [rainyPercent]);

  // Общая сумма на всех счетах (индикатор "Доступно всего")
  const availableToSpend = mainBalance + giftBalance + rainyBalance;

  // Сбрасываем модалку и очищаем поля формы после закрытия/успешной отправки.
  const closeModal = useCallback(() => {
    setActiveModal('');
    setIncomeAmount('');
    setExpenseName('');
    setExpenseAmount('');
    setExpensePriority('3');
    setError('');
  }, []);

  useEffect(() => {
    if (!activeModal) return undefined;

    function handleDocumentKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
      }
    }

    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => document.removeEventListener('keydown', handleDocumentKeyDown);
  }, [activeModal, closeModal]);

  function openIncomeModal() {
    setError('');
    setActiveModal('income');
  }

  function openExpenseModal() {
    setError('');
    setActiveModal('expense');
  }

  function openSettingsModal() {
    setError('');
    setActiveModal('settings');
  }

  function handleIncomeSubmit(event) {
    event.preventDefault();
    const amount = Number(incomeAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Введите корректную сумму дохода больше 0.');
      return;
    }

    // Распределение дохода:
    // Используем настраиваемые проценты для подарков и резерва, остальное в основной счет.
    const toGifts = saveToGifts ? amount * (giftPercent / 100) : 0;
    const toRainy = saveToRainyDay ? amount * (rainyPercent / 100) : 0;
    const toMain = amount - toGifts - toRainy;

    setMainBalance((prev) => prev + toMain);
    setGiftBalance((prev) => prev + toGifts);
    setRainyBalance((prev) => prev + toRainy);
    setIncomeTotal((prev) => prev + amount);

    closeModal();
  }

  function handleExpenseSubmit(event) {
    event.preventDefault();
    const trimmedName = expenseName.trim();
    const amount = Number(expenseAmount);
    const priority = Number(expensePriority);

    if (!trimmedName) {
      setError('Введите название расхода.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Введите корректную сумму расхода больше 0.');
      return;
    }

    if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
      setError('Важность должна быть от 1 до 5.');
      return;
    }

    // Сначала валидируем источник списания, затем уменьшаем соответствующий баланс.
    if (expenseSource === 'main') {
      if (mainBalance < amount) {
        setError('На выбранном счете недостаточно средств.');
        return;
      }
      setMainBalance((prev) => prev - amount);
    }

    if (expenseSource === 'gifts') {
      if (giftBalance < amount) {
        setError('На выбранном счете недостаточно средств.');
        return;
      }
      setGiftBalance((prev) => prev - amount);
    }

    if (expenseSource === 'rainyDay') {
      if (rainyBalance < amount) {
        setError('На выбранном счете недостаточно средств.');
        return;
      }
      setRainyBalance((prev) => prev - amount);
    }

    setExpenseTotal((prev) => prev + amount);
    // Добавляем новую карточку расхода в начало списка, чтобы новые были сверху.
    setExpenseItems((prev) => [
      {
        id: Date.now(),
        title: trimmedName,
        amount,
        priority,
        source: expenseSource,
      },
      ...prev,
    ]);

    closeModal();
  }

  // Для карточек расходов: переводим внутренний ключ счета в понятное название.
  function getSourceLabel(source) {
    if (source === 'gifts') return 'Подарки';
    if (source === 'rainyDay') return 'На черный день';
    return 'Основной баланс';
  }

  // "Выполнено" убирает карточку из списка, но не возвращает деньги в баланс.
  function handleCompleteExpense(expenseId) {
    setExpenseItems((prev) => prev.filter((item) => item.id !== expenseId));
  }

  function handleSettingsSubmit(event) {
    event.preventDefault();
    const gift = Number(giftPercent);
    const rainy = Number(rainyPercent);

    if (!Number.isFinite(gift) || gift < 0 || gift > 100) {
      setError('Процент на подарки должен быть от 0 до 100.');
      return;
    }

    if (!Number.isFinite(rainy) || rainy < 0 || rainy > 100) {
      setError('Процент на черный день должен быть от 0 до 100.');
      return;
    }

    if (gift + rainy > 100) {
      setError('Сумма процентов не может превышать 100%.');
      return;
    }

    closeModal();
  }

  /** Обнуляет балансы, месячные итоги и список расходов; проценты — в значения по умолчанию (10%). localStorage подтянется через useEffect. */
  function handleResetAllData() {
    const confirmed = window.confirm(
      'Сбросить все данные? Все балансы и суммы за месяц станут 0, список расходов удалится, проценты распределения — 10% и 10%.',
    );

    if (!confirmed) return;

    setMainBalance(0);
    setGiftBalance(0);
    setRainyBalance(0);
    setIncomeTotal(0);
    setExpenseTotal(0);
    setExpenseItems([]);
    setGiftPercent(10);
    setRainyPercent(10);
    setError('');
    closeModal();
  }

  return (
    <main className="app">
      {/* Декоративный анимированный фон, не несет смысловой нагрузки */}
      <div className="aurora-wrap" aria-hidden="true">
        <Aurora
          colorStops={['#5227FF', '#7cff67', '#5227FF']}
          amplitude={1}
          blend={0.5}
        />
      </div>

      <section className="panel">
        {/* Верхняя часть: общий заголовок и карточки сводной финансовой информации */}
        <h1>Money&apos;s — ваш трекер бюджета</h1>
        <p className="subtitle">
          Управляйте доходами и расходами, распределяйте деньги на подарки и
          финансовую подушку.
        </p>

        <section className="dashboard-shell" aria-label="Сводка по счетам и лимиты">
          <div className="dashboard-layout">
            <div className="dashboard-cards">
              <article
                className="card card--main"
                aria-labelledby="main-balance-heading"
              >
                <p className="card__eyebrow" id="main-balance-heading">
                  Основной баланс
                </p>
                <h2 className="card__amount">{formatRub(mainBalance)}</h2>
                <span className="card__hint">Доступно для повседневных трат</span>
              </article>

              <article className="card card--gifts card--stat">
                <p className="card__eyebrow">Подарки</p>
                <h3 className="card__amount">{formatRub(giftBalance)}</h3>
                <span className="card__hint">Копилка для приятностей</span>
              </article>

              <article className="card card--rainy card--stat">
                <p className="card__eyebrow">На черный день</p>
                <h3 className="card__amount">{formatRub(rainyBalance)}</h3>
                <span className="card__hint">Резервный фонд</span>
              </article>

              <article className="card card--income card--stat">
                <p className="card__eyebrow">Доходы за месяц</p>
                <h3 className="card__amount">{formatRub(incomeTotal)}</h3>
                <span className="card__hint">Все поступления</span>
              </article>

              <article className="card card--expense card--stat">
                <p className="card__eyebrow">Расходы за месяц</p>
                <h3 className="card__amount">{formatRub(expenseTotal)}</h3>
                <span className="card__hint">Все списания</span>
              </article>
            </div>

            <aside className="total-summary" aria-label="Сводка по всем счетам">
              <p className="total-summary__label">Доступно всего</p>
              <p className="total-summary__amount">{formatRub(availableToSpend)}</p>
              <p className="total-summary__hint">Основной + подарки + резерв</p>
            </aside>
          </div>
        </section>

        <div className="btn-container">
          {/* Кнопки открывают соответствующие формы в модальном окне */}
          <button className="add-income" type="button" onClick={openIncomeModal}>
            Добавить доход
          </button>
          <button className="add-outcome" type="button" onClick={openExpenseModal}>
            Добавить расход
          </button>
          <button className="settings-btn" type="button" onClick={openSettingsModal}>
            Настройки
          </button>
        </div>

        {/* Нижний блок: история добавленных расходов */}
        <section className="expense-list-section" aria-label="Список расходов">
          <h3 className="expense-list-title">Расходы</h3>

          {expenseItems.length === 0 ? (
            <p className="expense-empty">Пока нет расходов. Добавьте первый расход.</p>
          ) : (
            <div className="expense-grid">
              {expenseItems.map((item) => (
                <article className="expense-item" key={item.id}>
                  <p className="expense-item-title">{item.title}</p>
                  <p className="expense-item-amount">{formatRub(item.amount)}</p>
                  <p className="expense-item-meta">
                    Важность: <strong>{item.priority}/5</strong>
                  </p>
                  <p className="expense-item-meta">Счет: {getSourceLabel(item.source)}</p>
                  <button
                    type="button"
                    className="done-expense"
                    onClick={() => handleCompleteExpense(item.id)}
                  >
                    Выполнено
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {activeModal && (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="modal-title">
              {activeModal === 'income' && 'Новый доход'}
              {activeModal === 'expense' && 'Новый расход'}
              {activeModal === 'settings' && 'Настройки'}
            </h3>

            {/* Один модальный контейнер, внутри выбираем форму по типу activeModal */}
            {activeModal === 'income' ? (
              <form onSubmit={handleIncomeSubmit}>
                <label htmlFor="income-input">Сумма дохода</label>
                <input
                  id="income-input"
                  type="number"
                  min="1"
                  step="0.01"
                  value={incomeAmount}
                  onChange={(event) => setIncomeAmount(event.target.value)}
                  placeholder="Например, 50000"
                  required
                />

                <div className="checkbox-list">
                  <label>
                    <input
                      type="checkbox"
                      checked={saveToGifts}
                      onChange={(event) => setSaveToGifts(event.target.checked)}
                    />
                    Откладывать {giftPercent}% на подарки
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={saveToRainyDay}
                      onChange={(event) => setSaveToRainyDay(event.target.checked)}
                    />
                    Откладывать {rainyPercent}% на черный день
                  </label>
                </div>

                {error && <p className="error">{error}</p>}

                <div className="modal-actions">
                  <button type="submit" className="add-income">
                    Сохранить доход
                  </button>
                  <button type="button" className="ghost" onClick={closeModal}>
                    Отмена
                  </button>
                </div>
              </form>
            ) : activeModal === 'expense' ? (
              <form onSubmit={handleExpenseSubmit}>
                <label htmlFor="expense-name-input">Название расхода</label>
                <input
                  id="expense-name-input"
                  type="text"
                  value={expenseName}
                  onChange={(event) => setExpenseName(event.target.value)}
                  placeholder="Например, Продукты"
                  required
                />

                <label htmlFor="expense-input">Сумма расхода</label>
                <input
                  id="expense-input"
                  type="number"
                  min="1"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(event) => setExpenseAmount(event.target.value)}
                  placeholder="Например, 3500"
                  required
                />

                <label htmlFor="source-select">Откуда списывать</label>
                <select
                  id="source-select"
                  value={expenseSource}
                  onChange={(event) => setExpenseSource(event.target.value)}
                >
                  <option value="main">Основной баланс</option>
                  <option value="gifts">Подарки</option>
                  <option value="rainyDay">На черный день</option>
                </select>

                <label htmlFor="priority-select">Важность (1-5)</label>
                <select
                  id="priority-select"
                  value={expensePriority}
                  onChange={(event) => setExpensePriority(event.target.value)}
                >
                  <option value="1">1 - Низкая</option>
                  <option value="2">2</option>
                  <option value="3">3 - Средняя</option>
                  <option value="4">4</option>
                  <option value="5">5 - Очень важная</option>
                </select>

                {error && <p className="error">{error}</p>}

                <div className="modal-actions">
                  <button type="submit" className="add-outcome">
                    Сохранить расход
                  </button>
                  <button type="button" className="ghost" onClick={closeModal}>
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSettingsSubmit}>
                <label htmlFor="gift-percent-input">Процент на подарки (%)</label>
                <input
                  id="gift-percent-input"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={giftPercent}
                  onChange={(event) => setGiftPercent(event.target.value)}
                  placeholder="Например, 10"
                  required
                />

                <label htmlFor="rainy-percent-input">Процент на черный день (%)</label>
                <input
                  id="rainy-percent-input"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={rainyPercent}
                  onChange={(event) => setRainyPercent(event.target.value)}
                  placeholder="Например, 10"
                  required
                />

                {error && <p className="error">{error}</p>}

                <div className="modal-actions">
                  <button type="submit" className="settings-btn">
                    Сохранить настройки
                  </button>
                  <button type="button" className="ghost" onClick={closeModal}>
                    Отмена
                  </button>
                </div>

                <div className="settings-danger-zone" role="group" aria-label="Сброс данных">
                  <p className="settings-danger-hint">
                    Удалить все сохранённые суммы и карточки расходов; проценты вернутся к 10%.
                  </p>
                  <button
                    type="button"
                    className="reset-data"
                    onClick={handleResetAllData}
                  >
                    Сбросить данные
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
