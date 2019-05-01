import React, { Component } from 'react';
import { Grommet } from 'grommet';
import createBrowserHistory from 'history/createBrowserHistory';
import { Provider } from 'mobx-react';
import { RouterStore, syncHistoryWithStore } from 'mobx-react-router';
import { Router, Route } from 'react-router';
import BrowseBuildsPage from './pages/browse-builds';


const BlueTheme = {
   "global": {
        "colors": {
            "background": "rgba(0,0,0,0)",
            "brand": "#00b7ff",
            "accent": ["#3399cc", "#cc3399"],
            "border": {
                "light": "rgba(255,255,255,.5)"
            },
            "text": {
                "light": "#f8f8f8"
            }
        },
        "input": {"border": {"radius": "4px"}},
        "drop": {
            "background": "rgba(0,0,0,.8)"
        }
    },
    "button": {"border": {"radius": "4px"}},
    "checkBox": {"border": {"radius": "4px"}},
    "layer": {"border": {"radius": "4px"}}
};

const browserHistory = createBrowserHistory();
const routingStore = new RouterStore();

const stores = {
    // Key can be whatever you want
    routing: routingStore,
    // ...other stores
};

const history = syncHistoryWithStore(browserHistory, routingStore);


class App extends Component {
  render() {
    return (
      <Grommet theme={BlueTheme}>
          <Provider {...stores}>
              <Router history={history}>
                  <Route path="/" component={BrowseBuildsPage} />
              </Router>
          </Provider>
      </Grommet>
    );
  }
}

export default App;
