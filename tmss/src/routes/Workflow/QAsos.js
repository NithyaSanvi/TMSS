import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../layout/components/PageHeader';
import {Growl} from 'primereact/components/growl/Growl';
import { Button } from 'primereact/button';
// import AppLoader from '../../layout/components/AppLoader';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File
import {Checkbox} from 'primereact/checkbox';
// import {InputText} from 'primereact/inputtext';
import ScheduleService from '../../services/schedule.service';


class QAreportingView extends Component{
    constructor(props) {
        super(props);
        this.state={
           
            content: localStorage.getItem('report_qa'),
            showEditor: false,
            checked: false,
            pchecked:false
            
            
        };
        this.onSave = this.onSave.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        ScheduleService.getSchedulingUnitBlueprintById(this.props.match.params.id)
            .then(schedulingUnit => {
                this.setState({schedulingUnit: schedulingUnit});
            })
    }

    handleChange(e) {
        this.setState({
            content: e
        });
        localStorage.setItem('report_qa', e);
    }

    onSave() {
        this.props.history.push({
            pathname: `/schedulingunit/1/workflow/verification`,
        });
     }


    render() {
        return (
            <React.Fragment>
                <Growl ref={(el) => this.growl = el} />
                <PageHeader location={this.props.location} title={'QA Reporting (SOS/SDOC)'} actions={[{icon:'fa-window-close',link:this.props.history.goBack, title:'Click to Close Workflow', props:{ pathname:'/schedulingunit/1/workflow/verification'}}]}/>
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
                                <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Quality Policy</label>
                                <div className="col-lg-3 col-md-3 col-sm-12">
                                <div className="p-field-checkbox">
                                    <Checkbox inputId="binary" checked={this.state.checked} onChange={e => this.setState({ checked: e.checked })}  />
                                </div>
                                </div>
                                <div className="col-lg-1 col-md-1 col-sm-12"></div>
                                <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Show PI</label>
                                <div className="col-lg-3 col-md-3 col-sm-12">
                                <div className="p-field-checkbox">
                                    <Checkbox inputId= "secondary" pchecked={this.state.pchecked} onChange={e => this.setState({ pchecked: e.checked })} />
                                </div>
                                </div>
                            </div>
                            <div className="p-grid" style={{padding: '10px'}}>
                                <label htmlFor="comments" >Operator Report</label>
                                <div className="col-lg-12 col-md-12 col-sm-12"></div>
                                    {this.state.showEditor && <SunEditor  height="250" enableToolbar={true}
                                        onChange={this.handleChange}
                                        setContents={this.state.content}
                                        setOptions={{
                                            buttonList: [
                                            ['undo', 'redo', 'bold', 'underline', 'fontColor', 'table', 'link', 'image', 'video','italic', 'strike', 'subscript', 
                                            'superscript','outdent', 'indent','fullScreen', 'showBlocks', 'codeView','preview', 'print','removeFormat']
                                            ]
                                        }}
                                    />}
                            {!this.state.showEditor && <div onClick={() => this.setState({showEditor: !this.state.showEditor})} dangerouslySetInnerHTML={{__html: this.state.content}}></div>}
                            </div>
                            </div>
                             <div className="p-grid" style={{marginTop: '20px'}}>
                                <div className="p-col-1">
                                    <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick = {this.onSave} />
                                </div>
                                <div className="p-col-1">
                                    <Button label="Cancel" className="p-button-danger" icon="pi pi-times" onClick={() => this.setState({ showEditor: false })} />
                                </div>
                            </div>

                        </div>                          
                    </> 
                    }
                </React.Fragment>  
        )};  
}
export default QAreportingView; 