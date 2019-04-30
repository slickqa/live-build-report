import React, { Component } from 'react';
import { Grommet, Box } from 'grommet';
import LabeledMeter from './components/labeled-meter';
import { Panel } from './components/panels';
import LabeledValue from './components/labeled-value';
import AgentCard from './components/agent';
import moment from 'moment';

const SoFiTheme = {
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

let Started = new Date();

let Agents = [
    {
        name: "agent1",
        test: {
            name: "Do something neat in the Browser",
            started: moment().subtract(1, 'minutes'),
            expected: 12,
        }
    },
    {
        name: "agent2",
        test: {
            name: "Yo Ma Ma",
            started: moment().subtract(38, 'minutes'),
            expected: 41,
        }
    },
    {
        name: "agent3",
        test: {
            name: "So Fat",
            started: moment().subtract(12, 'minutes'),
            expected: 18,
        }
    },
    {
        name: "agent4",
        test: {
            name: "Toes in the sand",
            started: moment().subtract(4, 'minutes'),
            expected: 22,
        }
    },
    {
        name: "agent5",
        test: {
            name: "Lil Weeter",
            started: moment().subtract(16, 'minutes'),
            expected: 14,
        }
    },
    {
        name: "agent6",
        test: {
            name: "Gabe and Anna",
            started: moment().subtract(32, 'minutes'),
            expected: 52,
        }
    },
    {
        name: "agent7",
        test: {
            name: "Chuck Norris",
            started: moment().subtract(13, 'minutes'),
            expected: 19,
        }
    },
    {
        name: "agent8",
        test: {
            name: "Ridiculous test name title that is a run on sentence",
            started: moment().subtract(9, 'minutes'),
            expected: 11,
        }
    },
    {
        name: "agent9",
        test: {
            name: "The answer to life, the universe, and everything: 42",
            started: moment().subtract(42, 'minutes'),
            expected: 42,
        }
    },
    {
        name: "agent10",
        test: {
            name: "Live long and Prosper",
            started: moment().subtract(3, 'minutes'),
            expected: 7,
        }
    },
    {
        name: "agent11",
        test: {
            name: "I eat Special K, Life",
            started: moment().subtract(27, 'minutes'),
            expected: 35,
        }
    },
    {
        name: "agent12",
        test: {
            name: "When did Mike get here?",
            started: moment().subtract(5, 'minutes'),
            expected: 7,
        }
    },
    {
        name: "agent13",
        test: {
            name: "GMP: Avoid at all costs",
            started: moment().subtract(6, 'minutes'),
            expected: 7,
        }
    },
    {
        name: "agent14",
        test: {
            name: "Foo Bar Hello World",
            started: moment().subtract(22, 'minutes'),
            expected: 29,
        }
    },
    {
        name: "agent15",
        test: {
            name: "develop agents",
            started: moment().subtract(5, 'minutes'),
            expected: 6,
        }
    },
    {
        name: "agent16",
        test: {
            name: "This should result in a soft pass",
            started: moment().subtract(8, 'minutes'),
            expected: 9,
        }
    },
];

class App extends Component {
  render() {
    return (
      <Grommet theme={SoFiTheme}>
          <Box margin="small" direction="row" gap="small" justify="center" wrap="true">
              <Panel width="medium">
                  <LabeledValue label="Build" value="1.0 build 1" />
                  <LabeledValue label="Started" value={Started.toLocaleString()} />
                  <LabeledValue label="Total" value="82" />
                  <Box border="horizontal" pad={{vertical: "xsmall"}} margin={{vertical: "xsmall"}}>
                  <LabeledValue label="Running" color="status-ok" value="16" />
                  <LabeledValue label="Scheduled" value="38" />
                  </Box>
                  <LabeledValue label="PASS" color="status-ok" value="22" />
                  <LabeledValue label="FAIL" color="status-error" value="6" />

              </Panel>
              <Panel width="medium">
                  <LabeledMeter defaultValue="Running" values={[
                      {
                          value: 38,
                          label: "Scheduled",
                          color: "status-unknown"
                      },
                      {
                          value: 16,
                          label: "Running",
                          color: "status-ok"
                      },
                      {
                          value: 28,
                          label: "Finished",
                          color: "neutral-3"
                      }
                  ]} />
              </Panel>
              <Panel width="medium">
                  <LabeledMeter defaultValue="PASS" values={[
                      {
                          value: 54,
                          label: "NO_RESULT",
                          color: "status-unknown"
                      },
                      {
                          value: 22,
                          label: "PASS",
                          color: "status-ok"
                      },
                      {
                          value: 6,
                          label: "FAIL",
                          color: "status-error"
                      }
                  ]} />
              </Panel>
          </Box>
          <Box margin="small" direction="row" gap="medium" wrap="true" justify="center">
              {Agents.map((agent) => {
                  return <AgentCard agent={agent} />;
              })}

          </Box>
      </Grommet>
    );
  }
}

export default App;
