import React, { Component } from "react";
import { observer } from 'mobx-react';
import { Panel } from '../components/panels';


export default observer(class BrowseBuildsPage extends Component {
    render() {
        return <Panel>Builds</Panel>;

    }
});

