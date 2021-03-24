import React, { useEffect, useState } from 'react';
import PageHeader from '../../layout/components/PageHeader';
import {Growl} from 'primereact/components/growl/Growl';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import ScheduleService from '../../services/schedule.service';
import Scheduled from './Scheduled';
import ProcessingDone from './processing.done';
import QAreporting from './qa.reporting';
import QAsos from './qa.sos';
import PIverification from './pi.verification';
import DecideAcceptance from './decide.acceptance';
import Ingesting from './ingesting';
import DataProduct from './unpin.data';
import UnitConverter from '../../utils/unit.converter';
import AppLoader from '../../layout/components/AppLoader';
import WorkflowService from '../../services/workflow.service';
import DataProductService from '../../services/data.product.service';

const RedirectionMap = {
    'wait scheduled': 1,
    'wait processed': 2,
    'qa reporting to': 3,
    'qa reporting sos':4,
    'pi verification':5,
    'decide acceptance':6,
    'ingest done':7,
    'unpin data':8
 };

//Workflow Page Title 
const pageTitle = ['Waiting To Be Scheduled','Scheduled','QA Reporting (TO)', 'QA Reporting (SDCO)', 'PI Verification', 'Decide Acceptance','Ingest','Unpin Data'];

export default (props) => {
    let growl;
    // const [disableNextButton, setDisableNextButton] = useState(false);
    const [loader, setLoader] = useState(false);
    const [state, setState] = useState({});
    const [tasks, setTasks] = useState([]);
    const [QASUProcess, setQASUProcess] = useState();
    const [currentStep, setCurrentStep] = useState();
    const [schedulingUnit, setSchedulingUnit] = useState();
    // const [ingestTask, setInjestTask] = useState({});
    // const [QASchedulingTask, setQASchdulingTask] = useState([]);

    useEffect(() => {
        setLoader(true);
        const promises = [
            ScheduleService.getSchedulingUnitExtended('blueprint', props.match.params.id),
            ScheduleService.getTaskType()
        ]
        Promise.all(promises).then(responses => {
            const SUB = responses[0];
            setSchedulingUnit(responses[0]);
            setTasks(SUB.task_blueprints);
            getStatusUpdate(SUB.task_blueprints);
        });
    }, []);

    
    /**
     * Method to fetch data product for each sub task except ingest.
     * @param {*} taskItems List of tasks
     */
    const getDataProductDetails = async (taskItems) => {
        // setLoader(true);
        taskItems = taskItems?taskItems:tasks;
        const taskList = [...taskItems];
        for (const task of taskList) {
            if (task.specifications_template.type_value === 'observation' || task.specifications_template.type_value === 'pipeline') {
                const promises = [];
                task.subtasks_ids.map(id => promises.push(DataProductService.getSubtaskOutputDataproduct(id)));
                const dataProducts = await Promise.all(promises);
                task['dataProducts'] = dataProducts.filter(product => product.data.length).map(product => product.data).flat();
                task.actionpath = `/task/view/blueprint/${task.id}/dataproducts`;
                task.totalDataSize = _.sumBy(task['dataProducts'], 'size');
                task.dataSizeNotDeleted = _.sumBy(task['dataProducts'], function(product) { return product.deletedSince?0:product.size});
                if (task.totalDataSize) {
                    task.totalDataSize = UnitConverter.getUIResourceUnit('bytes', (task.totalDataSize));
                }
                if (task.dataSizeNotDeleted) {
                    task.dataSizeNotDeleted = UnitConverter.getUIResourceUnit('bytes', (task.dataSizeNotDeleted));
                }
            }
        }
        // setInjestTask(taskList.find(task => task.specifications_template.type_value==='ingest'));
        // setTasks(taskList);
        // setLoader(false);
    };

    /**
     * Method to fetch current step workflow details 
     * @param {*} taskList List of tasks
     */
    const getStatusUpdate = (taskList) => {
        setLoader(true);
        const promises = [
            WorkflowService.getWorkflowProcesses(),
            WorkflowService.getWorkflowTasks()
        ]
        Promise.all(promises).then(async responses => {
            const suQAProcess = responses[0].find(process => process.su === parseInt(props.match.params.id));
            setQASUProcess(suQAProcess);
            const suQAProcessTasks = responses[1].filter(item => item.process === suQAProcess.id);
            // setQASchdulingTask(suQAProcessTasks);
            // const workflowLastTask = responses[1].find(task => task.process === suQAProcess.id);
            const workflowLastTask = (_.orderBy(suQAProcessTasks, ['id'], ['desc']))[0];
            setCurrentStep(RedirectionMap[workflowLastTask.flow_task.toLowerCase()]);
            // Need to cross check below if condition if it fails in next click
            if (workflowLastTask.status === 'NEW') {
                setCurrentStep(RedirectionMap[workflowLastTask.flow_task.toLowerCase()]);
            } //else {
            //     setCurrentStep(3);
            // }
            else if (workflowLastTask.status.toLowerCase() === 'done' || workflowLastTask.status.toLowerCase() === 'finished') {
                await getDataProductDetails(taskList);
                // setDisableNextButton(true);
                setCurrentStep(8);
            }
            setLoader(false); 
        });
    }

    const getIngestTask = () => {
        return tasks.find(task => task.specifications_template.type_value==='ingest')
    }

    const getCurrentTaskDetails = async () => {
        // const response = await WorkflowService.getCurrentTask(props.match.params.id);
        const response = await WorkflowService.getCurrentTask(QASUProcess.id);
        return response;
    };

   //Pages changes step by step
    const onNext = (content) => {
        setState({...state, ...content});
        getStatusUpdate(tasks);
    };

    const onCancel = () => {
        props.history.goBack();
    }

    //TODO: Need to customize this function to have different messages.
    const showMessage = () => {
        growl.show({severity: 'error', summary: 'Unable to proceed', detail: 'Please clear your browser cookies and try again'});
    }

    const title = pageTitle[currentStep - 1];
    return (
        <>
            <Growl ref={(el) => growl = el} />
            {currentStep && <PageHeader location={props.location} title={`${title}`} actions={[{ icon: 'fa-window-close', link: props.history.goBack, title: 'Click to Close Workflow', props: { pathname: '/schedulingunit/1/workflow' } }]} />}
            {loader && <AppLoader />}
            {!loader && schedulingUnit &&
                <>
                    <div className="p-fluid">
                        {currentStep && <div className="p-field p-grid">
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
                                    <a rel="noopener noreferrer" href="https://proxy.lofar.eu/inspect/HTML/" target="_blank">Inspection plots</a>
                                </label>
                                <label className="col-sm-10 ">
                                    <a rel="noopener noreferrer" href="https://proxy.lofar.eu/qa" target="_blank">Adder plots</a>
                                </label>
                                <label className="col-sm-10 ">
                                    <a href=" https://proxy.lofar.eu/lofmonitor/" target="_blank">Station Monitor</a>
                                </label>
                            </div>
                        </div>}
                        {currentStep === 1 && <Scheduled onNext={onNext} onCancel={onCancel} 
                                                schedulingUnit={schedulingUnit} /*disableNextButton={disableNextButton}*/ />}
                        {currentStep === 2 && <ProcessingDone onNext={onNext} onCancel={onCancel} 
                                                schedulingUnit={schedulingUnit}  />}
                        {currentStep === 3 && <QAreporting onNext={onNext} onCancel={onCancel} id={QASUProcess.id} 
                                                getCurrentTaskDetails={getCurrentTaskDetails} onError={showMessage} />}
                        {currentStep === 4 && <QAsos onNext={onNext} onCancel={onCancel} id={QASUProcess.id} 
                                                process={QASUProcess} getCurrentTaskDetails={getCurrentTaskDetails} 
                                                onError={showMessage} />}
                        {currentStep === 5 && <PIverification onNext={onNext} onCancel={onCancel} id={QASUProcess.id} 
                                                process={QASUProcess} getCurrentTaskDetails={getCurrentTaskDetails} 
                                                onError={showMessage} />}
                        {currentStep === 6 && <DecideAcceptance onNext={onNext} onCancel={onCancel} id={QASUProcess.id} 
                                                process={QASUProcess} getCurrentTaskDetails={getCurrentTaskDetails} 
                                                onError={showMessage} />}
                        {currentStep === 7 && <Ingesting onNext={onNext} onCancel={onCancel} id={QASUProcess.id} 
                                                 onError={showMessage} task={getIngestTask()} />}
                        {currentStep === 8 && <DataProduct onNext={onNext} onCancel={onCancel} onError={showMessage} 
                                                tasks={tasks} schedulingUnit={schedulingUnit} />}
                    </div>
                </>
            }
        </>
    )
};