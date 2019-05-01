import React, { Component } from "react";
import { Anchor } from "grommet";

export default class BuildReportLink extends Component {

    render() {
        let { id, name } = this.props;
        return <Anchor href={"build-report/" + id} label={name} color="light-1"/>
    }
}

