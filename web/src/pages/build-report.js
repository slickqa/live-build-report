import React, { Component } from "react";
import { observer } from 'mobx-react';
import { Panel } from '../components/panels';
import LiveOverviewPanel from './live-overview';
import TestrunSidebarComponent from '../components/testrun-sidebar-component';
import { Grid, Box, Heading, Text } from "grommet";
import { decorate, observable } from "mobx";
import moment from 'moment';


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
        currentlyRunning: [],
        project: "",
        release: "",
        build: "",
        started: moment(),
        finished: moment(),
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
                    currentlyRunning: [],
                    project: "",
                    release: "",
                    build: "",
                    started: Date.now(),
                    finished: new Date(0),
                };
                if(buildReport.length > 0) {
                    overallStatus.project = buildReport[0].ProjectName;
                    overallStatus.release = buildReport[0].ReleaseName;
                    overallStatus.build = buildReport[0].BuildName;
                }
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
                    let testrunStarted = new Date(testrun.Started);
                    if(testrunStarted < overallStatus.started) {
                        overallStatus.started = testrunStarted;
                    }
                    let testrunFinished = new Date(testrun.Finished);
                    if(testrunFinished > overallStatus.finished) {
                        overallStatus.finished = testrunFinished;
                    }
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
                overallStatus.currentlyRunning.sort((a, b) => {
                    if(a.Id < b.Id) { return -1;}
                    if(a.Id > b.Id) { return 1;}
                    return 0;
                });
                this.overallStatus.currentlyRunning = overallStatus.currentlyRunning;
                this.overallStatus.project = overallStatus.project;
                this.overallStatus.release = overallStatus.release;
                this.overallStatus.build = overallStatus.build;
                this.overallStatus.started = moment(overallStatus.started);
                this.overallStatus.finished = moment(overallStatus.finished);
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
                    <Panel round="none" style={{minHeight: "100%", flexShrink: 0, overflowX: "hidden"}}>
                        <Box margin={{bottom: "small"}}>
                            <Box round="small" pad="small" margin={{bottom: "small"}} background={this.currentSelection === "overview" ? "brand" : undefined}><Heading style={{cursor: "pointer"}} level={2} margin={{vertical: "none"}} onClick={() => { this.currentSelection="overview"; }}>Overview</Heading></Box>
                        </Box>
                        <Box margin={{bottom: "small"}}>
                            <Box margin={{left: "small", bottom: "small"}}>
                                <Box margin={{bottom: "small"}}>
                                    <Text size="large">{this.overallStatus.project}: {this.overallStatus.release}.{this.overallStatus.build}</Text>
                                </Box>
                                <Box direction="row">
                                    <Box flex="grow"><Text size="large">Started</Text></Box>
                                    <Box width="small"><Text alignSelf="end" size="medium">{this.overallStatus.started.format('lll')}</Text></Box>
                                </Box>
                                {this.overallStatus.FINISHED === this.overallStatus.TOTAL ?
                                <Box direction="row">
                                    <Box flex="grow"><Text size="large">Finished</Text></Box>
                                    <Box width="small"><Text alignSelf="end" size="medium">{this.overallStatus.finished.format('lll')}</Text></Box>
                                </Box>
                                : null}
                            </Box>
                            <Box margin={{left: "small"}} direction="row">
                                <Box flex="grow"><Text size="large" weight="bold" color="neutral-3">Complete</Text></Box>
                                <Box width="xxsmall"><Text size="large" weight="bold" color="neutral-3">{((this.overallStatus.FINISHED / this.overallStatus.TOTAL) * 100).toFixed(1)}%</Text></Box>
                            </Box>
                            { this.overallStatus.PASS > 0 ?
                            <Box  margin={{left: "small"}} direction="row">
                                <Box flex="grow"><Text size="large" weight="bold" color="status-ok">PASS</Text></Box>
                                <Box width="xxsmall"><Text size="large" weight="bold" color="status-ok">{this.overallStatus.PASS}</Text></Box>
                                <Box width="xxsmall"><Text size="large" weight="bold" color="status-ok">{((this.overallStatus.PASS / this.overallStatus.TOTAL) * 100).toFixed(1)}%</Text></Box>
                            </Box>
                            : null }

                            { this.overallStatus.FAIL > 0 ?
                            <Box  margin={{left: "small"}} direction="row">
                                <Box flex="grow"><Text size="large" weight="bold" color="status-error">FAIL</Text></Box>
                                <Box width="xxsmall"><Text size="large" weight="bold" color="status-error">{this.overallStatus.FAIL}</Text></Box>
                                <Box width="xxsmall"><Text size="large" weight="bold" color="status-error">{((this.overallStatus.FAIL / this.overallStatus.TOTAL) * 100).toFixed(1)}%</Text></Box>
                            </Box>
                            : null }

                            { this.overallStatus.BROKEN_TEST > 0 ?
                            <Box  margin={{left: "small"}} direction="row">
                                <Box flex="grow"><Text size="large" weight="bold" color="status-warning">BROKEN TEST</Text></Box>
                                <Box width="xxsmall"><Text size="large" weight="bold" color="status-warning">{this.overallStatus.BROKEN_TEST}</Text></Box>
                                <Box width="xxsmall"><Text size="large" weight="bold" color="status-warning">{((this.overallStatus.BROKEN_TEST / this.overallStatus.TOTAL) * 100).toFixed(1)}%</Text></Box>
                            </Box>
                            : null }

                            { this.overallStatus.SKIPPED > 0 ?
                            <Box  margin={{left: "small"}} direction="row">
                                <Box flex="grow"><Text size="large" weight="bold" color="neutral-4">SKIPPED</Text></Box>
                                <Box width="xxsmall"><Text size="large" weight="bold" color="neutral-4">{this.overallStatus.SKIPPED}</Text></Box>
                                <Box width="xxsmall"><Text size="large" weight="bold" color="neutral-4">{((this.overallStatus.SKIPPED / this.overallStatus.TOTAL) * 100).toFixed(1)}%</Text></Box>
                            </Box>
                            : null }

                            { this.overallStatus.NO_RESULT > 0 ?
                            <Box  margin={{left: "small"}} direction="row">
                                <Box flex="grow"><Text size="large" weight="bold" color="status-unknown">NO RESULT</Text></Box>
                                <Box width="xxsmall"><Text size="large" weight="bold" color="status-unknown">{this.overallStatus.NO_RESULT}</Text></Box>
                                <Box width="xxsmall"><Text size="large" weight="bold" color="status-unknown">{((this.overallStatus.NO_RESULT / this.overallStatus.TOTAL) * 100).toFixed(1)}%</Text></Box>
                            </Box>
                            : null }
                        </Box>
                        {this.buildReport.map((testrun) => {
                            return <TestrunSidebarComponent key={testrun.Id} report={testrun} onclick={() => { this.currentSelection=testrun.Id }} selected={this.currentSelection === testrun.Id} />
                        })}
                    </Panel>
                </Box>
                <Box gridArea="main" margin={{right: "small"}} style={{overflowY: "auto"}}>
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

