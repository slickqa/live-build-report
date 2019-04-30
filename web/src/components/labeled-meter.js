import React, { Component } from "react";
import { Box, Meter, Stack, Text } from "grommet";

export default class LabeledMeter extends Component {

    constructor(props) {
        super(props);
        let total = 0;
        props.values.forEach((item) => {
           total += item.value;
        });
        const { defaultValue } = this.props;
        this.defaultItem = {
            value: 0,
            label: undefined,
            color: undefined
        };
        if(defaultValue) {
            this.props.values.forEach(value => {
                if(defaultValue === value.label) {
                    this.defaultItem.value = value.value;
                    this.defaultItem.label = value.label;
                    this.defaultItem.color = value.color;
                }
            });
        }
        this.state = {
            total: total,
            active: this.defaultItem.value,
            label: this.defaultItem.label,
            color: this.defaultItem.color
        }
    }

    render() {
        const { active, label, total, color } = this.state;
        return (
            <Stack anchor="center">
                <Meter
                    type="circle"
                    values={ this.props.values.map((item) => {
                        return {
                            value: item.value,
                            color: item.color,
                            onHover: over =>
                                this.setState({
                                    active: over ? item.value : this.defaultItem.value,
                                    label: over ? item.label : this.defaultItem.label,
                                    color: over ? item.color : this.defaultItem.color
                                })
                        }
                    })}
                    max={this.state.total}
                />
                <Box align="center">
                    <Box direction="row" align="center" pad={{ bottom: "xsmall" }}>
                        <Text size="xxlarge" weight="bold" color={color}>
                            {active || total}
                        </Text>
                    </Box>
                    <Text color={color}>{label || "Total"}</Text>
                </Box>
            </Stack>
        );
    }
}

