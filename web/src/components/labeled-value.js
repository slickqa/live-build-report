import React, { Component } from "react";
import { Box, Text } from "grommet";

export default class LabeledValue extends Component {
    render() {
        return(
            <Box>
                <Text size="small" weight="bold">{this.props.label}</Text>
                <Text margin={{horizontal: "small"}} color={this.props.color}>{this.props.value}</Text>
            </Box>
        )
    }
}
