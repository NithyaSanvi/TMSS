import React, {Component} from 'react';
import { Dropdown } from 'primereact/dropdown';
import _ from 'lodash';
import { appGrowl , setAppGrowl } from './AppGrowl';
import { Growl } from 'primereact/components/growl/Growl';
import { InputText } from 'primereact/inputtext';

export class FindObject extends Component {

    constructor(props) {
        super(props);
        this.state = {
            // Find Object - dropdown list value
            objectTypes: [
                {name: 'Scheduling Unit', code: 'sublueprint'},
                {name: 'Task', code: 'taskblueprint'},
                {name: 'Subtask', code: 'subtask'},
               // {name: 'Task Draft', code: 'taskdraft'},
                //{name: 'SU Draft', code: 'sudraft'},
                // {name: 'Project', code: 'project'},
            ],
            objectId: '',
            objectType:  {name: 'Scheduling Unit', code: 'sublueprint'}
        };
        this.findObject = this.findObject.bind(this);
        this.setObjectType = this.setObjectType.bind(this);
        this.setFindObjectId = this.setFindObjectId.bind(this);
        this.handleEvent = this.handleEvent.bind(this);
    }

    /**
     * 
     * @param {Key Event} e - Key code
     */
    handleEvent(e) {
        var key = e.which || e.keyCode;
        if(key === 13 || key === 'Enter') {
            this.findObject();
        }
    }
    
    /**
     * Set Object Type
     * @param {String} value - Object type value
     */
    setObjectType(value) {
        if (value.name && value.name === 'Project') {
            this.setState({objectType: value});
        }   else if(isNaN(this.state.objectId)){
            this.setState({objectType: value, objectId: ''});
        }   else {
            this.setState({objectType: value});
        }
    }

    /**
     * Set Object id value
     * @param {String/Number} value - Object id, accepts alphanumeric if object type is 'Project'
     */
    setFindObjectId(value) {
        if (this.state.objectType.name === 'Project' || !isNaN(value)) {
            this.setState({objectId: value});
        }   else{
            appGrowl.show({severity: 'info', summary: 'Information', detail: 'Enter valid object Id'});
        }
    }
        
    /**
     * Callback function to find Object
     */
    findObject() {
        if (this.state.objectId && this.state.objectId.length > 0) {
            this.props.setSearchField(this.state.objectType.code, this.state.objectId);
        }   else {
            appGrowl.show({severity: 'info', summary: 'Information', detail: 'Enter Object Id'});
        }
    }

    render() {
        return (
            <React.Fragment>
                <Growl ref={(el) => setAppGrowl(el)} />
                <div className="top-right-bar find-object-search" style={{marginRight: '1em'}}>
                    <Dropdown  
                        className="p-link layout-menu-button find-object-type" 
                        value={this.state.objectType} 
                        options={this.state.objectTypes}   
                        optionLabel="name"  
                        onChange={(e) => {this.setObjectType(e.value)}}
                    />
                    
                    
                    <InputText 
                        value={this.state.objectId} 
                        onChange={(e) => {this.setFindObjectId(e.target.value)}} 
                        title='Enter Object Id to search Object'
                        className="find-object-search-input"  
                        placeholder="Search by ID" 
                        onKeyDown={this.handleEvent}
                    />
                    <button  className="p-link layout-menu-button" style={{float: 'right'}} onClick={this.findObject} >
                        <i className="pi pi-search find-object-search-btn" />
                    </button>
                    
                </div>
            </React.Fragment>
        );
    }
}
