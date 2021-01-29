import React, { useEffect, useState } from 'react';
import PageHeader from '../../layout/components/PageHeader';
import {Growl} from 'primereact/components/growl/Growl';
import { Link } from 'react-router-dom';
import ScheduleService from '../../services/schedule.service';
import Scheduled from './Scheduled';
import ProcessingDone from './processing.done';
import QAreporting from './qa.reporting';
import QAsos from './qa.sos';
import PIverification from './pi.verification';
import DecideAcceptance from './decide.acceptance';
import IngestDone from './ingest.done';

//
const RedirectionMap = {
    'Wait Scheduled': 1,
    'Wait Processed': 2,
    'Qa Reporting To': 3,
    'QA Reporting Sos':4,
    'Pi Verification':5,
    'Decide Acceptance':6,
    'Ingesting':7
 };

//Workflow Page Title 
const pageTitle = ['Scheduled','Processing Done','QA Reporting (TO)', 'QA Reporting (SDCO)', 'PI Verification', 'Decide Acceptance','Ingesting'];

export default (props) => {
    let growl;
    const [disableNextButton, setDisableNextButton] = useState(false);
    const [state, setState] = useState({});
    const [currentStep, setCurrentStep] = useState(1);
    const [schedulingUnit, setSchedulingUnit] = useState();
    const [ingestTask, setInjestTask] = useState({});
    useEffect(() => {
        // Clearing Localstorage on start of the page to load fresh
        clearLocalStorage();
        ScheduleService.getSchedulingUnitBlueprintById(props.match.params.id)
            .then(schedulingUnit => {
                setSchedulingUnit(schedulingUnit);
            })
            const promises = [
                ScheduleService.getSchedulingUnitBlueprintById(props.match.params.id),
                ScheduleService.getTaskType(),
                ScheduleService.getQASchedulingUnitProcess(),
                ScheduleService.getQASchedulingUnitTask()
            ]
            Promise.all(promises).then(responses => {
                const suQAProcess = responses[2].find(process => process.su === parseInt(props.match.params.id));
                const suQATask = responses[3].find(task => task.process === suQAProcess.id);
                if (suQATask.status === 'NEW') {
                    setCurrentStep(RedirectionMap[suQATask.flow_task]);
                } else {
                    setCurrentStep(3);
                }
                if (suQATask.status.toLowerCase() === 'done') {
                    setDisableNextButton(true)
                }
                setSchedulingUnit(responses[0]);
                ScheduleService.getTaskBlueprintsBySchedulingUnit(responses[0], true, false).then(response => {
                    setInjestTask(response.find(task => task.template.type_value==='observation'));
                });
            });
    }, []);

    const clearLocalStorage = () => {
        localStorage.removeItem('pi_comment');
        localStorage.removeItem('report_qa');
    }
    
    //Pages changes step by step
    const onNext = (content) => {
        setState({...state, ...content});
        setCurrentStep(currentStep + 1);  
    };

    return (
        <>
            <Growl ref={(el) => growl = el} />
            {currentStep && <PageHeader location={props.location} title={`${pageTitle[currentStep - 1]}`} actions={[{ icon: 'fa-window-close', link: props.history.goBack, title: 'Click to Close Workflow', props: { pathname: '/schedulingunit/1/workflow' } }]} />}
            {schedulingUnit &&
                <>
                    <div className="p-fluid">
                        <div className="p-field p-grid">
                            <label htmlFor="suName" className="col-lg-2 col-md-2 col-sm-12">Scheduling Unit</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <Link to={{ pathname: `/schedulingunit/view/blueprint/${schedulingUnit.id}` }}>{schedulingUnit.name}</Link>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Scheduling Unit Status</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <span>{schedulingUnit.status}</span>
                            </div>
                            <label htmlFor="viewPlots" className="col-lg-2 col-md-2 col-sm-12">View Plots</label>
                            <div className="col-lg-3 col-md-3 col-sm-12" style={{ paddingLeft: '2px' }}>
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
                        {currentStep === 1 && <Scheduled onNext={onNext} {...state} schedulingUnit={schedulingUnit} /*disableNextButton={disableNextButton}*/ />}
                        {currentStep === 2 && <ProcessingDone onNext={onNext} {...state} schedulingUnit={schedulingUnit}  />}
                        {currentStep === 3 && <QAreporting onNext={onNext} id={props.match.params.id} />}
                        {currentStep === 4 && <QAsos onNext={onNext} {...state} />}
                        {currentStep === 5 && <PIverification onNext={onNext} {...state} />}
                        {currentStep === 6 && <DecideAcceptance onNext={onNext} {...state} />}
                        {currentStep === 7 && <IngestDone onNext={onNext}{...state} task={ingestTask}/>}
                      
                    </div>
                </>
            }
        </>
    )
};