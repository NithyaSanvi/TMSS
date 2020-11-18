import React, { Component } from 'react';
import PageHeader from '../../layout/components/PageHeader';
import {Growl} from 'primereact/components/growl/Growl';
import { Button } from 'primereact/button';
// import AppLoader from '../../layout/components/AppLoader';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File
import {Dropdown} from 'primereact/dropdown';
// import {InputText} from 'primereact/inputtext';
import ScheduleService from '../../services/schedule.service';
import { Link } from 'react-router-dom';
import katex from 'katex'
import 'katex/dist/katex.min.css'

class QAreporting extends Component{
   
    constructor(props) {
        super(props);
        this.state={};
        this.onSave = this.onSave.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        ScheduleService.getSchedulingUnitBlueprintById(this.props.match.params.id)
            .then(schedulingUnit => {
                this.setState({schedulingUnit: schedulingUnit});
            })
    }
    onSave() {
        this.props.history.push({
            pathname: `/schedulingunit/1/workflow/view`,
        });
     }

    handleChange(e) {
        localStorage.setItem('report_qa', e);
     
    }

    render() {
        return (
            <React.Fragment>
                <Growl ref={(el) => this.growl = el} />
                <PageHeader location={this.props.location} title={'QA Reporting (TO)'} actions={[{icon:'fa-window-close',link:this.props.history.goBack, title:'Click to Close Workflow', props:{ pathname: '/schedulingunit/view'}}]}/>
                {this.state.schedulingUnit &&
                <>
                    <div>
                        <div className="p-fluid">
                           <div className="p-field p-grid">
                                <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Scheduling Unit</label>
                                <div className="col-lg-3 col-md-3 col-sm-12">
                                    <Link to={ { pathname:`/schedulingunit/view/blueprint/${this.state.schedulingUnit.id}`}}>{this.state.schedulingUnit.name}</Link>
                                </div>
                                <div className="col-lg-1 col-md-1 col-sm-12"></div>
                                <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Scheduling Unit Status</label>
                                <div className="col-lg-3 col-md-3 col-sm-12">
                                    {/* <InputText   id="suStatus" data-testid="name" disabled
                                    value={this.state.schedulingUnit.status}/> */}
                                    <span>{this.state.schedulingUnit.status}</span>
                                </div>
                            </div>
                            <div className="p-field p-grid">
                                <label htmlFor="assignTo" className="col-lg-2 col-md-2 col-sm-12">Assign To </label>
                                <div className="col-lg-3 col-md-3 col-sm-12" data-testid="assignTo" >
                                    <Dropdown inputId="projCat" optionLabel="value" optionValue="value"
                                    options={[{value: 'User 1'},{value: 'User 2'},{value: 'User 3'}]} 
                                    placeholder="Assign To" />
                                </div>
                                <div className="col-lg-1 col-md-1 col-sm-12"></div>
                                <label htmlFor="viewPlots" className="col-lg-2 col-md-2 col-sm-12">View Plots</label>
                                <div className="col-lg-3 col-md-3 col-sm-12" style={{paddingLeft:'2px'}}>
                                            <label className="col-sm-10 " >
                                            <a href="https://proxy.lofar.eu/inspect/HTML/" target="_blank">Inspection plots</a>
                                            </label>
                                            <label className="col-sm-10 ">
                                            <a href="https://proxy.lofar.eu/qa" target="_blank">Adder plots</a>
                                            </label>
                                            <label className="col-sm-10 ">
                                            <a href=" https://proxy.lofar.eu/lofmonitor/" target="_blank">Station Monitor</a>
                                            </label>
                                </div>
                            </div>
                            <div className="p-grid" style={{padding: '10px'}}>
                                <label htmlFor="comments" >Comments</label>
                                <div className="col-lg-12 col-md-12 col-sm-12"></div>
                                    <SunEditor  height="250" enableToolbar={true}
                                     onChange={this.handleChange}
                                    setOptions={{
                                        buttonList: [
                                        ['undo', 'redo', 'bold', 'underline', 'fontColor', 'table', 'link', 'image', 'video','italic', 'strike', 'subscript', 
                                        'superscript','outdent', 'indent','fullScreen', 'showBlocks', 'codeView','preview', 'print','removeFormat']
                                        ]
                                }} />
                                </div>
                            </div>
                            <div className="p-grid" style={{marginTop: '20px'}}>
                                <div className="p-col-1">
                                <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={this.onSave}/>
                                </div>
                                <div className="p-col-1">
                                    <Button label="Cancel" className="p-button-danger" icon="pi pi-times" />
                                </div>
                            </div>
                           
                        </div>                          
                    </> 
                    }
                </React.Fragment>  
        )};  
}
export default QAreporting;