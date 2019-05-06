import React, { Component } from 'react';
import { Box } from 'grommet';
import { Panel } from '../components/panels';
import LabeledMeter from '../components/labeled-meter';
import { observer } from 'mobx-react';
import Agent from '../components/agent';


class LiveOverviewPanel extends Component {
  render() {
    let { report } = this.props;
    return (
      <Box>
        <Box margin="small" direction="row" gap="small" justify="center" wrap={true}>
            <Panel width="medium">
                <LabeledMeter defaultValue={report.RUNNING > 0 ? "Running" : "Finished"} values={[
                    {
                        value: report.SCHEDULED,
                        label: "Scheduled",
                        color: "status-unknown"
                    },
                    {
                        value: report.TO_BE_RUN,
                        label: "To be run",
                        color: "neutral-2"
                    },
                    {
                        value: report.RUNNING,
                        label: "Running",
                        color: "status-ok"
                    },
                    {
                        value: report.FINISHED,
                        label: "Finished",
                        color: "neutral-3"
                    }
                ]} />
            </Panel>
            <Panel width="medium">
                <LabeledMeter defaultValue="PASS" values={[
                    {
                        value: report.NO_RESULT,
                        label: "NO RESULT",
                        color: "status-unknown"
                    },
                    {
                        value: report.PASS,
                        label: "PASS",
                        color: "status-ok"
                    },
                    {
                        value: report.FAIL,
                        label: "FAIL",
                        color: "status-error"
                    },
                    {
                        value: report.BROKEN_TEST,
                        label: "BROKEN TEST",
                        color: "status-warning"
                    },
                    {
                        value: report.SKIPPED,
                        label: "SKIPPED",
                        color: "neutral-4"
                    }
                ]} />
            </Panel>
        </Box>
        <Box margin="small" direction="row" gap="small" justify="center" wrap={true}>
          {report.currentlyRunning.map((result) => {
            return(
              <Agent result={result}/>
            );
          })}
        </Box>
      </Box>
    );
  }
}

export default observer(LiveOverviewPanel);
