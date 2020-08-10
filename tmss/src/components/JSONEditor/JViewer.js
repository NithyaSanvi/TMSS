/**
 * Component to view the JSON data using 'react-json-view' package
 */
import React, {Component} from 'react';
import ReactJson from 'react-json-view';

export default class JViewer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            outputJSON: props.outputJSON
        }
        this.updateOutput = this.updateOutput.bind(this);
    }
    
    /**
     * Function to be called by the parent to update the JSON content of the viewer
     * @param {JSON} outputJSON 
     */
    updateOutput(outputJSON) {
        this.state.outputJSON = outputJSON;
    }
    
    render() {
        return (
            <React.Fragment>
                <ReactJson src={this.state.outputJSON} />
            </React.Fragment>
        );
    }
}