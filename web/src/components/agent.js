import React, { Component } from "react";
import { Image } from "grommet";
import { Panel } from "./panels";
import LabeledValue from "./labeled-value";
import moment from 'moment';

export default class Agent extends Component {
    render() {
        return(
            <Panel width="3in" height="3in" margin={{top: "small"}}>
                <Image fit="contain" src={"images/" + this.props.agent.name + ".png"} />
                <LabeledValue label="Test" color="status-ok" value={this.props.agent.test.name} />
                <LabeledValue label="Runtime (expected)" color={this.getStatusColor()} value={this.props.agent.test.started.fromNow(true) + " (" + this.props.agent.test.expected + " minutes)"} />
            </Panel>
        );
    }

    getStatusColor() {
        let runtimeInMinutes = moment().diff(this.props.agent.test.started, 'minutes');
        console.log(runtimeInMinutes);
        if(runtimeInMinutes >= (this.props.agent.test.expected - 1) &&
           runtimeInMinutes <= (this.props.agent.test.expected + 1)) {
            return "status-warning";
        } else if(runtimeInMinutes > this.props.agent.test.expected + 1) {
            return "status-error";
        }
    }
}
