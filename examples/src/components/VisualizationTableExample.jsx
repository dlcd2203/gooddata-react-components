import React, { Component } from 'react';
import '@gooddata/react-components/styles/css/main.css';
import { Visualization } from '@gooddata/react-components';

import { projectId, tableVisualizationIdentifier } from '../utils/fixtures';
import { Loading } from './Loading';
import { Error } from './Error';

export class VisualizationTable extends Component {
    render() {
        return (
            <div style={{ height: 300 }} >
                <Visualization
                    projectId={projectId}
                    identifier={tableVisualizationIdentifier}
                    LoadingComponent={Loading}
                    ErrorComponent={Error}
                />
            </div>
        );
    }
}

export default VisualizationTable;