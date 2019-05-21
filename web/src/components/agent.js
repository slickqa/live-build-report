import React, { Component } from "react";
import { Image } from "grommet";
import { Panel } from "./panels";
import LabeledValue from "./labeled-value";
import moment from 'moment';

export default class Agent extends Component {
    render() {
        let { result } = this.props;
        let started = moment(result.Started);
        return(
            <Panel width="3in" height="3in" margin={{top: "small"}}>
                <Image fit="contain" src={"images/agents/" + result.Hostname + "/" + result.Hostname + "-screenshot.png"} />
                <LabeledValue label="Test" color="status-ok" value={result.Testcase.name} />
                <LabeledValue label="Runtime (expected)" color={this.getStatusColor()} value={started.fromNow(true) + " (" + (result.Attributes.estimatedRuntime / 60).toFixed(0) + " minutes)"} />
            </Panel>
        );
    }

    getStatusColor() {
        let runtimeInMinutes = moment().diff(moment(this.props.result.Started), 'minutes');
        let expected = parseInt(this.props.result.Attributes.estimatedRuntime) / 60
        if(runtimeInMinutes >= (expected - 1) &&
           runtimeInMinutes <= (expected + 1)) {
            return "status-warning";
        } else if(runtimeInMinutes > expected + 1) {
            return "status-error";
        }
    }
}
