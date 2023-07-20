import React, { Suspense, lazy } from 'react';
import logo from './logo.svg';
import Header from './Header';
import { Router, Route, Switch } from 'react-router-dom'
import history from './history'
import { mainClass } from './styles'
import Loading from './Components/Loading';

const Home = lazy(() => import('./pages/Home'));

function App() {


  return (
    <Router history={history}>
      <div className="App">
        <Header />
        <div className={mainClass('body')}>
          <Suspense fallback={<Loading/>}>
            <Switch>
              <Route exact path="/index" component={Home} />
              {/* <Route path="/components" component={Components} />
              <Route path="/documentation" component={Documentation} /> */}
            </Switch>
          </Suspense>
        </div>
      </div>
    </Router>
  );
}

export default App;
