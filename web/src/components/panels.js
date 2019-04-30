import React, { Component } from "react";
import { Box } from "grommet";


export class Panel extends Component {
    render() {
        return(
            <Box margin={this.props.margin} width={this.props.width} height={this.props.height} background={{color: "black", opacity: 0.6, dark: true}} pad="small" round="medium">
                {this.props.children}
            </Box>
        )
    }

}

export class SquarePanel extends Component {
    constructor(props) {
        super(props);
        this.size = this.props.size ? this.props.size : "medium";
    }

    render() {
        return(
            <Panel width={this.size} height={this.size}>{this.props.children}</Panel>
        )
    }
}