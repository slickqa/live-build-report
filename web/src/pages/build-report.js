import React, { Component } from "react";
import { observer } from 'mobx-react';
import { Panel } from '../components/panels';
import LiveOverviewPanel from './live-overview';
import TestrunSidebarComponent from '../components/testrun-sidebar-component';
import { Grid, Box, Heading } from "grommet";
import { decorate, observable } from "mobx";


class BuildReportPage extends Component {
    buildReport = [];
    currentSelection = "overview";
    overallStatus = {
        PASS: 0,
        FAIL: 0,
        BROKEN_TEST: 0,
        SKIPPED: 0,
        NO_RESULT: 0,
        SCHEDULED: 0,
        TO_BE_RUN: 0,
        RUNNING: 0,
        FINISHED: 0,
        TOTAL: 0,
        currentlyRunning: []
    };

    getBuildReport(buildId) {
        fetch("api/build-report/" + buildId, { headers: {Accept: "application/json"}}).then(response => {
            response.json().then((buildReport) => {
                let overallStatus = {
                    PASS: 0,
                    FAIL: 0,
                    BROKEN_TEST: 0,
                    SKIPPED: 0,
                    NO_RESULT: 0,
                    SCHEDULED: 0,
                    TO_BE_RUN: 0,
                    RUNNING: 0,
                    FINISHED: 0,
                    TOTAL: 0,
                    currentlyRunning: []
                };
                buildReport.forEach((testrun) => {
                    overallStatus.PASS += testrun.PASS;
                    overallStatus.FAIL += testrun.FAIL;
                    overallStatus.BROKEN_TEST += testrun.BROKEN_TEST;
                    overallStatus.SKIPPED += testrun.SKIPPED;
                    overallStatus.NO_RESULT += testrun.NO_RESULT;
                    overallStatus.SCHEDULED += testrun.SCHEDULED;
                    overallStatus.TO_BE_RUN += testrun.TO_BE_RUN;
                    overallStatus.RUNNING += testrun.RUNNING;
                    overallStatus.FINISHED += testrun.FINISHED;
                    overallStatus.TOTAL += (testrun.SCHEDULED + testrun.TO_BE_RUN + testrun.RUNNING + testrun.FINISHED);
                    overallStatus.currentlyRunning.push(...testrun.CurrentlyRunning);
                });
                this.overallStatus.PASS = overallStatus.PASS;
                this.overallStatus.FAIL = overallStatus.FAIL;
                this.overallStatus.BROKEN_TEST = overallStatus.BROKEN_TEST;
                this.overallStatus.SKIPPED = overallStatus.SKIPPED;
                this.overallStatus.NO_RESULT = overallStatus.NO_RESULT;
                this.overallStatus.SCHEDULED = overallStatus.SCHEDULED;
                this.overallStatus.TO_BE_RUN = overallStatus.TO_BE_RUN;
                this.overallStatus.RUNNING = overallStatus.RUNNING;
                this.overallStatus.FINISHED = overallStatus.FINISHED;
                this.overallStatus.TOTAL = overallStatus.TOTAL;
                this.overallStatus.currentlyRunning = overallStatus.currentlyRunning;
                this.buildReport = buildReport;
                setTimeout(this.getBuildReport.bind(this, buildId), 3000);
            }, () => {
                setTimeout(this.getBuildReport.bind(this, buildId), 3000);
            });
        }, () => {
            setTimeout(this.getBuildReport.bind(this, buildId), 3000);
        });
    }

    componentDidMount() {
        this.getBuildReport(this.props.match.params.id);
    }

    render() {
        return (
            <Grid fill={true} gap="small" columns={["medium", "flex"]} rows={["full"]} areas={[
                {
                    name: "sidebar",
                    start: [ 0, 0 ],
                    end: [ 0, 0 ]
                },
                {
                    name: "main",
                    start: [ 1, 0 ],
                    end: [ 1, 0]
                }
            ]}>
                <Box gridArea="sidebar" style={{overflowY: "auto"}}>
                    <Panel round="none" style={{minHeight: "100%", flexShrink: 0}}>
                        <Box margin={{bottom: "small"}}>
                            <Box round="small" pad="small" margin={{bottom: "small"}} background={this.currentSelection === "overview" ? "brand" : undefined}><Heading style={{cursor: "pointer"}} level={2} margin={{vertical: "none"}} onClick={() => { this.currentSelection="overview"; }}>Overview</Heading></Box>

                        </Box>
                        {this.buildReport.map((testrun) => {
                            return <TestrunSidebarComponent key={testrun.Id} report={testrun} onclick={() => { this.currentSelection=testrun.Id }} selected={this.currentSelection === testrun.Id} />
                        })}
                    </Panel>
                </Box>
                <Box gridArea="main" margin={{right: "small"}}>
                    {this.currentSelection === "overview"? <LiveOverviewPanel report={this.overallStatus} /> : <iframe title="Testrun Results" src={"https://slick.sofitest.com/old/testruns/" + this.currentSelection} allowtransparency="true" style={{width: "100%", height: "100%", border: "none"}} /> }
                </Box>

            </Grid>
        );
    }

}

decorate(BuildReportPage,{
    currentSelection: observable,
    buildReport: observable,
    overallStatus: observable
});

export default observer(BuildReportPage);

