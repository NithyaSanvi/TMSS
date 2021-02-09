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
    'ingesting':7,
    'unpin data':8
 };

//Workflow Page Title 
const pageTitle = ['Scheduled','Processing Done','QA Reporting (TO)', 'QA Reporting (SDCO)', 'PI Verification', 'Decide Acceptance','Ingesting','Unpin Data'];

export default (props) => {
    let growl;
    // const [disableNextButton, setDisableNextButton] = useState(false);
    const [loader, setLoader] = useState(false);
    const [state, setState] = useState({});
    const [tasks, setTasks] = useState([]);
    const [QASchProcess, setQASchProcess] = useState();
    const [currentStep, setCurrentStep] = useState();
    const [schedulingUnit, setSchedulingUnit] = useState();
    const [ingestTask, setInjestTask] = useState({});
    const [QASchedulingTask, setQASchdulingTask] = useState([]);

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
            setLoader(false); 
        });
    }, []);

    
    /**
     * Method to fetch data product for each sub task except ingest.
     * @param {*} taskItems List of tasks
     */
    const getDataProductDetails = async (taskItems) => {
        setLoader(true);
        const taskList = [...taskItems];
        for (let i = 0; i < taskList.length; i++) {
            if (taskList[i].specifications_template.name !== 'ingest') {
                const promises = [];
                taskList[i].subtasks_ids.map(id => promises.push(DataProductService.getSubtaskOutputDataproduct(id)));
                const dataProducts = await Promise.all(promises);
                taskList[i]['dataProducts'] = dataProducts.filter(product => product.data.length).map(product => product.data).flat();
                taskList[i].actionpath = `/task/view/blueprint/${taskList[i].id}/dataproducts`;
                (taskList[i].dataProducts || []).forEach(product => {
                    if (product.size) {
                        if (!taskList[i].totalDataSize) {
                            taskList[i].totalDataSize = 0;
                        }
                        taskList[i].totalDataSize += product.size;

                        // For deleted since
                        if (!product.deleted_since && product.size) {
                            if (!taskList[i].dataSizeNotDeleted) {
                                taskList[i].dataSizeNotDeleted = 0;
                            }
                            taskList[i].dataSizeNotDeleted += product.size;
                        }
                    }
                });
                if (taskList[i].totalDataSize) {
                    taskList[i].totalDataSize = UnitConverter.getUIResourceUnit('bytes', (taskList[i].totalDataSize));
                }
                if (taskList[i].dataSizeNotDeleted) {
                    taskList[i].dataSizeNotDeleted = UnitConverter.getUIResourceUnit('bytes', (taskList[i].dataSizeNotDeleted));
                }
            }
        }
        setInjestTask(taskList.find(task => task.specifications_template.type_value==='ingest'));
        setTasks(taskList);
        setLoader(false);
    };

    /**
     * Method to fetch current step workflow details 
     * @param {*} taskList List of tasks
     */
    const getStatusUpdate = (taskList) => {
        const promises = [
            ScheduleService.getQASchedulingUnitProcess(),
            ScheduleService.getQASchedulingUnitTask()
        ]
        Promise.all(promises).then(async responses => {
            const suQAProcess = responses[0].find(process => process.su === parseInt(props.match.params.id));
            setQASchProcess(suQAProcess);
            const suQATask = responses[1].find(task => task.process === suQAProcess.id);
            setCurrentStep(RedirectionMap[suQATask.flow_task.toLowerCase()]);
            setQASchdulingTask(responses[1].filter(item => item.process === suQAProcess.id));
            // Need to cross check below if condition if it fails in next click
            if (suQATask.status === 'NEW') {
                setCurrentStep(RedirectionMap[suQATask.flow_task.toLowerCase()]);
            } else {
                setCurrentStep(3);
            }
            if (suQATask.status.toLowerCase() === 'done' || suQATask.status.toLowerCase() === 'finished') {
                await getDataProductDetails(taskList);
                // setDisableNextButton(true);
                setCurrentStep(8);
            }
        });
    }

    const getCurrentTaskDetails = async () => {
        const response = await WorkflowService.getCurrentTask(props.match.params.id);
        return response;
    };

   //Pages changes step by step
    const onNext = (content) => {
        setState({...state, ...content});
        getStatusUpdate(tasks);
    };

    return (
        <>
            <Growl ref={(el) => growl = el} />
            {currentStep && <PageHeader location={props.location} title={`${pageTitle[currentStep - 1]}`} actions={[{ icon: 'fa-window-close', link: props.history.goBack, title: 'Click to Close Workflow', props: { pathname: '/schedulingunit/1/workflow' } }]} />}
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
                        {currentStep === 1 && <Scheduled onNext={onNext} schedulingUnit={schedulingUnit} /*disableNextButton={disableNextButton}*/ />}
                        {currentStep === 2 && <ProcessingDone onNext={onNext} schedulingUnit={schedulingUnit}  />}
                        {currentStep === 3 && <QAreporting onNext={onNext} id={props.match.params.id} process={QASchProcess} QASchedulingTask={QASchedulingTask} getCurrentTaskDetails={getCurrentTaskDetails} />}
                        {currentStep === 4 && <QAsos onNext={onNext} id={props.match.params.id} process={QASchProcess} QASchedulingTask={QASchedulingTask} getCurrentTaskDetails={getCurrentTaskDetails} />}
                        {currentStep === 5 && <PIverification onNext={onNext} id={props.match.params.id} process={QASchProcess} QASchedulingTask={QASchedulingTask} getCurrentTaskDetails={getCurrentTaskDetails} />}
                        {currentStep === 6 && <DecideAcceptance onNext={onNext} id={props.match.params.id} process={QASchProcess} QASchedulingTask={QASchedulingTask} getCurrentTaskDetails={getCurrentTaskDetails} />}
                        {currentStep === 7 && <Ingesting onNext={onNext} id={props.match.params.id} getDataProductDetails={getDataProductDetails.bind(null, tasks)} task={ingestTask} />}
                        {currentStep === 8 && <DataProduct onNext={onNext} id={props.match.params.id} process={QASchProcess} QASchedulingTask={QASchedulingTask} getCurrentTaskDetails={getCurrentTaskDetails} tasks={tasks} schedulingUnit={schedulingUnit} />}
                    </div>
                </>
            }
        </>
    )
};