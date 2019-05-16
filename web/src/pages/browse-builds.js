import React, { Component } from "react";
import { observer } from 'mobx-react';
import { Panel } from '../components/panels';
import BuildReportLink from '../components/build-report-link';
import { Heading, DataTable, Box, Meter, Select } from "grommet";
import { decorate, observable } from "mobx";
import Cookies from "js-cookie";


class BrowseBuildsPage extends Component {


    builds = [];
    projects = ["All"];
    currentProject = "All";

    getProjects() {
        fetch("api/projects", {headers: {Accept: "application/json"}}).then((resp) => {
            resp.json().then((projects) => {
                let newProjectsList = ["All"];
                projects.forEach((project) => {
                    newProjectsList.push(project.name);
                });
                this.projects = newProjectsList;
                let savedSettings = Cookies.getJSON("slick-live-build");
                if(savedSettings && savedSettings.project) {
                    this.currentProject = savedSettings.project;
                }
            });
        });
    }

    setCurrentProject(project) {
        if(this.nextPoll) {
            clearTimeout(this.nextPoll);
            this.nextPoll = "";
        }
        if(project === "All") {
            Cookies.set("slick-live-build", {project: null}, {expires: 3650});
            this.currentProject = project;
        } else {
            Cookies.set("slick-live-build", {project: project}, {expires: 3650});
            this.currentProject = project;
        }
        this.getBuilds();
    }

    getBuilds() {
        if(this.nextPoll) {
            this.nextPoll = undefined;
        }
        window.Cookies = Cookies;
        let savedSettings = Cookies.getJSON("slick-live-build");
        let url = "api/builds";
        if(savedSettings && savedSettings.project) {
            url = url + "/" + savedSettings.project;
        }
        fetch(url, {headers: {Accept: "application/json"}}).then((resp) => {
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
                if(!this.nextPoll) {
                    this.nextPoll = setTimeout(this.getBuilds.bind(this), 3000);
                }
            }, () => {
                if(!this.nextPoll) {
                    this.nextPoll = setTimeout(this.getBuilds.bind(this), 3000);
                }
            });
        }, () => {
            if(!this.nextPoll) {
                this.nextPoll = setTimeout(this.getBuilds.bind(this), 3000);
            }
        });
    }


    componentDidMount() {
        this.getProjects();
        this.getBuilds();
    }

    componentWillUnmount() {
        clearTimeout(this.nextPoll);
    }

    render() {
        return <Panel margin="small">
            <Box align="center"><Heading margin={{top: "none", bottom: "small"}} textAlign="center">Recent Builds</Heading></Box>
            <Box align="end" margin={{bottom: "small"}}><Select options={this.projects} value={this.currentProject} onChange={(option) => { this.setCurrentProject(option.value);}}/></Box>
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
    builds: observable,
    projects: observable,
    currentProject: observable
});

export default observer(BrowseBuildsPage);

