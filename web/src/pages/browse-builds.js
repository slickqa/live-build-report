import React, { Component } from "react";
import { observer, inject } from 'mobx-react';
import { Panel } from '../components/panels';
import BuildReportLink from '../components/build-report-link';
import { Heading, DataTable, Box, Meter } from "grommet";
import { decorate, observable } from "mobx";


class BrowseBuildsPage extends Component {

    builds = [];

    getBuilds() {
        fetch("api/builds", {headers: {Accept: "application/json"}}).then((resp) => {
            resp.json().then((builds) => {
                for (let i = 0; i < builds.length; i++) {
                    builds[i].name = builds[i].Release.Name + "." + builds[i].Release.Build.Name;
                    builds[i].buildId = builds[i].Release.Build.Id;
                    builds[i].numberOfTestruns = builds[i].TestrunSummaries.length;
                    builds[i].total = 0;
                    builds[i].finished = 0;
                    builds[i].running = 0;
                    builds[i].pass = 0;
                    builds[i].fail = 0;
                    builds[i].skipped = 0;
                    builds[i].broken = 0;
                    builds[i].noresult = 0;
                    builds[i].TestrunSummaries.forEach(summary => {
                        builds[i].finished += summary.FINISHED;
                        builds[i].running += summary.RUNNING;
                        builds[i].pass += summary.PASS;
                        builds[i].fail += summary.FAIL;
                        builds[i].skipped += summary.SKIPPED;
                        builds[i].broken += summary.BROKEN_TEST;
                        builds[i].noresult += summary.NO_RESULT;
                        builds[i].total += (summary.FINISHED + summary.RUNNING + summary.TO_BE_RUN + summary.SCHEDULED);
                    });
                    builds[i].complete = Math.ceil(((builds[i].finished / builds[i].total) * 100));
                }
                this.builds = builds;
                this.nextPoll = setTimeout(this.getBuilds.bind(this), 3000);
            }, () => {
                this.nextPoll = setTimeout(this.getBuilds.bind(this), 3000);
            });
        }, () => {
            this.nextPoll = setTimeout(this.getBuilds.bind(this), 3000);
        });
    }


    componentDidMount() {
        this.getBuilds();
    }

    componentWillUnmount() {
        clearTimeout(this.nextPoll);
    }

    render() {
        return <Panel>
            <Box align="center"><Heading margin={{top: "none"}} textAlign="center">Recent Builds</Heading></Box>
            <DataTable columns={[
                {
                    property: "ProjectName",
                    header: "Project"
                },
                {
                    property: "name",
                    header: "Build",
                    render: item => (
                        <BuildReportLink id={item.Release.Build.Id} name={item.name} />
                    )
                },
                {
                    property: "complete",
                    header: "% Complete",
                    render: item => (
                        <Box pad={{ vertical: 'xsmall' }}>
                            <Meter
                                values={[{ value: item.complete, color: "neutral-3" }]}
                                thickness="small"
                                size="small"
                            />
                        </Box>
                    )
                },
                {
                    property: "running",
                    header: "Currently Running"
                },
                {
                    property: "numberOfTestruns",
                    header: "# of Testruns"
                },
                {
                    header: "# of Tests",
                    property: "total"
                },
                {
                    header: "Results",
                    render: item => (
                        <Box pad={{ vertical: 'xsmall' }}>
                            <Meter
                                values={[
                                    { label: "PASS", value: item.pass, color: "status-ok" },
                                    { label: "FAIL", value: item.fail, color: "status-error" },
                                    { label: "BROKEN", value: item.broken, color: "status-warning" },
                                    { label: "SKIPPED", value: item.skipped, color: "neutral-4" },
                                    { label: "NO RESULT", value: item.noresult, color: "status-unknown" },
                                ]}
                                thickness="small"
                                size="small"
                            />
                        </Box>
                    )
                },
            ]}
            data={this.builds}
            primaryKey="buildId"
            />

        </Panel>;
        // return
    }
}

decorate(BrowseBuildsPage, {
    builds: observable
});

export default observer(BrowseBuildsPage);

