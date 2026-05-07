import { useState } from 'react';
import Aurora from './components/Aurora';
import './App.css';

// Простая функция, чтобы красиво выводить рубли
function formatRub(value) {
  return `${Number(value).toLocaleString('ru-RU')} руб.`;
}

function App() {
  // --- Финансовые состояния приложения ---
  // Три "кошелька" + агрегаты по месяцу.
  const [mainBalance, setMainBalance] = useState(29500);
  const [giftBalance, setGiftBalance] = useState(4000);
  const [rainyBalance, setRainyBalance] = useState(4000);
  const [incomeTotal, setIncomeTotal] = useState(40000);
  const [expenseTotal, setExpenseTotal] = useState(2500);

  // --- UI-состояния формы и модального окна ---
  // activeModal: '' | 'income' | 'expense'
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
  const [expenseItems, setExpenseItems] = useState([]);

  // Общая сумма на всех счетах (индикатор "Доступно всего")
  const availableToSpend = mainBalance + giftBalance + rainyBalance;

  // Сбрасываем модалку и очищаем поля формы после закрытия/успешной отправки.
  function closeModal() {
    setActiveModal('');
    setIncomeAmount('');
    setExpenseName('');
    setExpenseAmount('');
    setExpensePriority('3');
    setError('');
  }

  function openIncomeModal() {
    setError('');
    setActiveModal('income');
  }

  function openExpenseModal() {
    setError('');
    setActiveModal('expense');
  }

  function handleIncomeSubmit(event) {
    event.preventDefault();
    const amount = Number(incomeAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Введите корректную сумму дохода больше 0.');
      return;
    }

    // Распределение дохода:
    // 10% в подарки и/или 10% в резерв, остальное в основной счет.
    const toGifts = saveToGifts ? amount * 0.1 : 0;
    const toRainy = saveToRainyDay ? amount * 0.1 : 0;
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

        <div className="container">
          <article className="card">
            <p>Основной баланс</p>
            <h2>{formatRub(mainBalance)}</h2>
            <span>Базовые траты</span>
          </article>

          <article className="card">
            <p>Подарки</p>
            <h2>{formatRub(giftBalance)}</h2>
            <span>Копилка для приятностей</span>
          </article>

          <article className="card">
            <p>На черный день</p>
            <h2>{formatRub(rainyBalance)}</h2>
            <span>Резервный фонд</span>
          </article>

          <article className="card">
            <p>Доходы за месяц</p>
            <h2>{formatRub(incomeTotal)}</h2>
            <span>Все поступления</span>
          </article>

          <article className="card">
            <p>Расходы за месяц</p>
            <h2>{formatRub(expenseTotal)}</h2>
            <span>Все списания</span>
          </article>

          <article className="card accent">
            <p>Доступно всего</p>
            <h2>{formatRub(availableToSpend)}</h2>
            <span>Сумма всех счетов</span>
          </article>
        </div>

        <div className="btn-container">
          {/* Кнопки открывают соответствующие формы в модальном окне */}
          <button className="add-income" type="button" onClick={openIncomeModal}>
            Добавить доход
          </button>
          <button className="add-outcome" type="button" onClick={openExpenseModal}>
            Добавить расход
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
              {activeModal === 'income' ? 'Новый доход' : 'Новый расход'}
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
                    Откладывать 10% на подарки
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={saveToRainyDay}
                      onChange={(event) => setSaveToRainyDay(event.target.checked)}
                    />
                    Откладывать 10% на черный день
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
            ) : (
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
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
