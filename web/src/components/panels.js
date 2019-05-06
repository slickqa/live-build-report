import React, { Component } from "react";
import { Box } from "grommet";


export class Panel extends Component {
    render() {
        let { round }= this.props;
        if(!round) {
            round = "medium";
        }
        return(
            <Box margin={this.props.margin} width={this.props.width} height={this.props.height} background={{color: "black", opacity: "strong", dark: true}} pad="small" round={round} style={this.props.style}>
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