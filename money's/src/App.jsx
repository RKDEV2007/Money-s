import './App.css';

function App() {
  return (
    <div>
      <h1>Money's - Ваш трекер прибылей и убытков</h1>
      <div className="container">
        <div className="card">
          <p>Основной баланс</p>
          <h2>29500 руб.</h2>
          <p>Доступно для расходов</p>
        </div>
        <div className="card">
          <p>"Подарочный счет"</p>
          <h2>4000 руб.</h2>
          <p>10% от дохода</p>
        </div>
        <div className="card">
          <p>Сбережения на "черный день"</p>
          <h2>4000 руб.</h2>
          <p>10% от дохода</p>
        </div>
        <div className="card">
          <p>Доходы за месяц</p>
          <h2>40000 руб.</h2>
        </div>
        <div className="card">
          <p>Расходы за месяц</p>
          <h2>2500 руб.</h2>
        </div>
      </div>
    </div>
  )
}

export default App
