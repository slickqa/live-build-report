import React, { Component } from 'react';
import {Box, Heading, Meter} from 'grommet';


class TestrunSidebarComponent extends Component {
    render() {
        let { report, onclick, selected } = this.props;
        let total = report.PASS + report.FAIL + report.BROKEN_TEST + report.SKIPPED + report.NO_RESULT;
        return (
            <Box margin={{vertical: "xsmall"}}>
                <Box round="small" background={selected ? "brand" : undefined} margin={{vertical: "xxsmall"}} pad={{left: "xsmall"}}>
                    <Heading level={4} margin="none" onClick={onclick} style={{cursor: "pointer", textOverflow: "ellipsis", overflow: "hidden"}}>{report.Name} ({total})</Heading>
                </Box>
                <Box margin={{left: "xsmall"}}>
                    <Meter
                        values={[
                            { label: "PASS", value: report.PASS, color: "status-ok" },
                            { label: "FAIL", value: report.FAIL, color: "status-error" },
                            { label: "BROKEN", value: report.BROKEN_TEST, color: "status-warning" },
                            { label: "SKIPPED", value: report.SKIPPED, color: "neutral-4" },
                            { label: "NO RESULT", value: report.NO_RESULT, color: "status-unknown" },
                        ]}
                        thickness="small"
                        size="small"
                    />
                </Box>
            </Box>
        );
    }
}

export default TestrunSidebarComponent
