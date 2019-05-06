import React, { Component } from "react";
import { Box, Meter, Stack, Text } from "grommet";
import { observer } from "mobx-react";
import { observable, computed, decorate } from "mobx";

class LabeledMeter extends Component {

    current = {
        active: undefined,
        label: "",
        color: "status-unknown"
    };

    get defaultItem() {
        let defItem = {
            value: undefined,
            label: "",
            color: undefined
        };
        const { defaultValue } = this.props;
        if(defaultValue) {
            this.props.values.forEach(value => {
                if(defaultValue === value.label) {
                    defItem.value = value.value;
                    defItem.label = value.label;
                    defItem.color = value.color;
                }
            });
        }
        return defItem;
    }

    render() {
        let props = this.props;
        let total = 0;
        props.values.forEach((item) => {
            total += item.value;
        });

        let current = {
            active: this.current.active ? this.current.active : this.defaultItem.value,
            label: this.current.active ? this.current.label : this.defaultItem.label,
            color: this.current.active ? this.current.color : this.defaultItem.color
        }

        return (
            <Stack anchor="center">
                <Meter
                    type="circle"
                    values={ this.props.values.map((item) => {
                        return {
                            value: item.value,
                            color: item.color,
                            onHover: over => {
                                this.current.active = over ? item.value : this.defaultItem.value;
                                this.current.label = over ? item.label : this.defaultItem.label;
                                this.current.color = over ? item.color : this.defaultItem.color;
                            }
                        }
                    })}
                    max={total}
                />
                <Box align="center">
                    <Box direction="row" align="center" pad={{ bottom: "xsmall" }}>
                        <Text size="xxlarge" weight="bold" color={current.color}>
                            {current.active}
                        </Text>
                    </Box>
                    <Text color={current.color}>{current.label}</Text>
                </Box>
            </Stack>
        );
    }
}

decorate(LabeledMeter, {
    current: observable,
    defaultItem: computed
});

export default observer(LabeledMeter);
