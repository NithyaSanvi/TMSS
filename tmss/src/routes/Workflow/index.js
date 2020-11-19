import React, { useEffect, useState } from 'react';
import PageHeader from '../../layout/components/PageHeader';
import {Growl} from 'primereact/components/growl/Growl';
import { Link } from 'react-router-dom';
import ScheduleService from '../../services/schedule.service';
import QAreporting from './QAreporting';
import QAsos from './QAsos';
import PIverification from './PIverification';
import DecideAcceptance from './DecideAcceptance';
import Scheduled from './Scheduled';
import ProcessingDone from './Processing';

const heading = ['QA Reporting (TO)', 'QA Reporting (SOS/SDCO)', 'PI Verification', 'Decide Acceptance','Scheduled','ProcessingDone'];

export default (props) => {
    let growl;
    const [state, setState] = useState({});
    const [currentStep, setCurrentStep] = useState(1);
    const [schedulingUnit, setSchedulingUnit] = useState();
    useEffect(() => {
        // Clearing Localstorgae on start of the page to load fresh
        clearLocalStorage();
        ScheduleService.getSchedulingUnitBlueprintById(props.match.params.id)
            .then(schedulingUnit => {
                setSchedulingUnit(schedulingUnit);
            })
    }, []);

    const clearLocalStorage = () => {
        localStorage.removeItem('pi_comment');
        localStorage.removeItem('report_qa');
    }

    const onNext = (content) => {
        setState({...state, ...content});
        setCurrentStep(currentStep + 1);
    };

    return (
        <>
            <Growl ref={(el) => growl = el} />
            <PageHeader location={props.location} title={`${heading[currentStep - 1]}`} actions={[{ icon: 'fa-window-close', link: props.history.goBack, title: 'Click to Close Workflow', props: { pathname: '/schedulingunit/1/workflow/verification' } }]} />
            {schedulingUnit &&
                <>
                    <div className="p-fluid">
                        <div className="p-field p-grid">
                            <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Scheduling Unit</label>
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
                        {currentStep === 1 && <QAreporting onNext={onNext}/>}
                        {currentStep === 2 && <QAsos onNext={onNext} {...state} />}
                        {currentStep === 3 && <PIverification onNext={onNext} {...state} />}
                        {currentStep === 4 && <DecideAcceptance onNext={onNext} {...state} />}
                        {currentStep === 5 && <Scheduled onNext={onNext}{...state} schedulingUnit={schedulingUnit} />}
                        {currentStep === 6 && <ProcessingDone onNext={onNext} {...state} />}
                    </div>
                </>
            }
        </>
    )
};