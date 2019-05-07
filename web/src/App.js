import React, { Component } from 'react';
import { Grommet } from 'grommet';
import { Route } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import BrowseBuildsPage from './pages/browse-builds';
import BuildReportPage from './pages/build-report';


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


class App extends Component {
  render() {
    let baseTag = document.getElementsByTagName("base")[0];
    return (
      <Grommet full={true} theme={BlueTheme}>
        <BrowserRouter basename={baseTag.getAttribute("href")}>
          <Route path="/" exact component={BrowseBuildsPage} />
          <Route path="/build-report/:id" component={BuildReportPage} />
        </BrowserRouter>
      </Grommet>
    );
  }
}

export default App;
