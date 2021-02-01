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
import _ from 'lodash';
import DataProduct from './unpin.data';
import UnitConverter from '../../utils/unit.converter';


//
const RedirectionMap = {
    'wait scheduled': 1,
    'wait processed': 2,
    'qa reporting to': 3,
    'qa reporting sos':4,
    'pi verification':5,
    'decide acceptance':6,
    'ingesting':7
 };

//Workflow Page Title 
const pageTitle = ['Scheduled','Processing Done','QA Reporting (TO)', 'QA Reporting (SDCO)', 'PI Verification', 'Decide Acceptance','Ingesting'];

export default (props) => {
    let growl;
    const [disableNextButton, setDisableNextButton] = useState(false);
    const [state, setState] = useState({});
    const [currentStep, setCurrentStep] = useState();
    const [schedulingUnit, setSchedulingUnit] = useState();
    const [ingestTask, setInjestTask] = useState({});
    useEffect(() => {
        // Clearing Localstorage on start of the page to load fresh
        clearLocalStorage();
        ScheduleService.getSchedulingUnitBlueprintById(props.match.params.id)
        .then(schedulingUnit => {
            setSchedulingUnit(schedulingUnit);
        })
        const promises = [ScheduleService.getSchedulingUnitBlueprintById(props.match.params.id), ScheduleService.getTaskType()]
        Promise.all(promises).then(responses => {
            setSchedulingUnit(responses[0]);
            ScheduleService.getTaskBlueprintsBySchedulingUnit(responses[0], true, false, false, true).then(response => {
                response.map(task => {
                    task.actionpath = `/task/view/blueprint/${task.id}/dataproducts`;
                    (task.dataProducts || []).map(product => {
                        if (product.size) {
                            if (!task.totalDataSize) {
                                task.totalDataSize = 0;
                            }
                            task.totalDataSize += product.size;

                            // For deleted since
                            if (!product.deleted_since && product.size) {
                                if (!task.dataSizeNotDeleted) {
                                    task.dataSizeNotDeleted = 0;
                                }
                                task.dataSizeNotDeleted += product.size;
                            }
                        }
                    });
                    if (task.totalDataSize) {
                        task.totalDataSize = UnitConverter.getUIResourceUnit('bytes', (task.totalDataSize));
                    }
                    if (task.dataSizeNotDeleted) {
                        task.dataSizeNotDeleted = UnitConverter.getUIResourceUnit('bytes', (task.dataSizeNotDeleted));
                    }
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
                    setCurrentStep(RedirectionMap[suQATask.flow_task.toLowerCase()]);
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
                setTasks(response);
                setInjestTask(response.find(task => task.template.type_value==='observation'));
            });
        });
}, []);

    const getStatusUpdate = () => {
        const promises = [
            ScheduleService.getQASchedulingUnitProcess(),
            ScheduleService.getQASchedulingUnitTask()
        ]
        Promise.all(promises).then(responses => {
            const suQAProcess = responses[0].find(process => process.su === parseInt(props.match.params.id));
            const suQATask = responses[1].find(task => task.process === suQAProcess.id);
            setCurrentStep(RedirectionMap[suQATask.flow_task.toLowerCase()]);
            if (suQATask.status.toLowerCase() === 'done' || suQATask.status.toLowerCase() === 'finished') {
                setDisableNextButton(true)
            }
        });
    }


    const clearLocalStorage = () => {
        localStorage.removeItem('pi_comment');
        localStorage.removeItem('report_qa');
    }
    
    //Pages changes step by step
    const onNext = (content) => {
        setState({...state, ...content});
        getStatusUpdate();
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
                        {currentStep === 7 && <IngestDone onNext={onNext}{...state} task={ingestTask} />}
                        {currentStep === 8 && <DataProduct onNext={onNext} tasks={tasks} schedulingUnit={schedulingUnit} />}
                    </div>
                </>
            }
        </>
    )
};