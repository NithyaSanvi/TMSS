import React, { Component } from 'react'
import 'primeflex/primeflex.css';
import ViewTable from './../../components/ViewTable';
import CycleService from '../../services/cycle.service';

class CycleList extends Component{
	 constructor(props){
        super(props)
        this.state = {
            cyclelist: [],
            paths: [{
                "View": "/cycle",
            }],
            projectCategory: ['regular', 'user_shared_support']
        }
    }

    secondsToHours(d) {
        d = Number(d);
        return Math.floor(d / 3600);
    }
	
	 componentDidMount(){ 
        const { projectCategory } = this.state;
        const promises = [CycleService.getProjects(), CycleService.getCycleQuota()]
        Promise.all(promises).then(responses => {
            const projects = responses[0];
            const cycleQuota = responses[1];
            CycleService.getAllCycle().then(cyclelist =>{
                const results = cyclelist.data.results || [];
                results.map(cycle => {
                    const regularProjects = projects.data.results.filter(project => project.cycles_ids.includes(cycle.name) && projectCategory.includes(project.project_category_value));
                    const timediff = new Date(cycle.stop).getTime() - new Date(cycle.start).getTime();
                    cycle.duration = timediff / (1000 * 3600 * 24);
                    cycle.totalProjects = cycle.projects ? cycle.projects.length : 0;
                    cycle.id = cycle.name ? cycle.name.split(' ').join('') : cycle.name;
                    cycle.regularProjects = regularProjects.length;
                    cycle.observingTime = this.secondsToHours((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'observing_time') || {value: 0}).value)
                    cycle.processingTime = this.secondsToHours((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'cep_processing_time') || {value: 0}).value)
                    cycle.ltaResources = this.secondsToHours((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'lta_storage') || {value: 0}).value)
                    cycle.support = this.secondsToHours((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'support_time') || {value: 0}).value)
                    cycle.observingTimeDDT = this.secondsToHours((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'observing_time_commissioning') || {value: 0}).value)
                    cycle.observingTimePrioA = this.secondsToHours((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'observing_time_prio_a') || {value: 0}).value)
                    cycle.observingTimePrioB = this.secondsToHours((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'observing_time_prio_b') || {value: 0}).value)
                    return cycle;
                });
                this.setState({
                    cyclelist : results
                });
            })
        })  
    }
	
	render(){
        let defaultcolumns = [
            {
                id:"Cycle Code",
                start:"Start Date",
                stop: "End Date",
                duration: "Duration",
                totalProjects: 'No.of Projects',
                regularProjects: 'No.of Regular',
                observingTime: 'Observing Time (hr)',
                processingTime: 'Processing Time (hr)',
                ltaResources: 'LTA Resources (hr)',
                support: 'Support (hr)',
                observingTimeDDT: 'Observing Time Commissioning (hr)',
                observingTimePrioA: 'Observing Time Prio A (hr)',
                observingTimePrioB: 'Observing Time Prio B (hr)'
            }
        ]
        return (
            <>
                {/*
                    * Call View table to show table data, the parameters are,
                    data - Pass API data
                    defaultcolumns - This colum will be populate by default in table with header mentioned
                    showaction - {true/false} -> to show the action column
                    paths - specify the path for navigation - Table will set "id" value for each row in action button
                */}
                {(this.state.cyclelist && this.state.cyclelist.length) ?
                    <ViewTable 
                        data={this.state.cyclelist} 
                        defaultcolumns={defaultcolumns} 
                        showaction="false"
                        paths={this.state.paths}
                        showAllRows
                    /> : <></>
                 }  
            </>
        )
    }
}

export default CycleList

export const testData = [{
	"name": "Cycle 00",
	"url": "http://localhost:3000/api/cycle/Cycle%2000/",
	"created_at": "2020-08-06T12:06:09.074400",
	"description": "Lofar Cycle 0",
	"duration": 153,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/1/", "http://localhost:3000/api/cycle_quota/2/", "http://localhost:3000/api/cycle_quota/3/", "http://localhost:3000/api/cycle_quota/4/", "http://localhost:3000/api/cycle_quota/5/", "http://localhost:3000/api/cycle_quota/6/", "http://localhost:3000/api/cycle_quota/7/"],
	"quota_ids": [1, 2, 3, 4, 5, 6, 7],
	"start": "2013-06-01T00:00:00",
	"stop": "2013-11-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.074437",
	"totalProjects": 0,
	"id": "Cycle00",
	"regularProjects": 0,
	"observingTime": 2937,
	"processingTime": 2937,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 183,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 01",
	"url": "http://localhost:3000/api/cycle/Cycle%2001/",
	"created_at": "2020-08-06T12:06:09.093253",
	"description": "Lofar Cycle 1",
	"duration": 212,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/8/", "http://localhost:3000/api/cycle_quota/9/", "http://localhost:3000/api/cycle_quota/10/", "http://localhost:3000/api/cycle_quota/11/", "http://localhost:3000/api/cycle_quota/12/", "http://localhost:3000/api/cycle_quota/13/", "http://localhost:3000/api/cycle_quota/14/"],
	"quota_ids": [8, 9, 10, 11, 12, 13, 14],
	"start": "2013-11-01T00:00:00",
	"stop": "2014-06-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.093283",
	"totalProjects": 0,
	"id": "Cycle01",
	"regularProjects": 0,
	"observingTime": 4070,
	"processingTime": 4070,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 254,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 02",
	"url": "http://localhost:3000/api/cycle/Cycle%2002/",
	"created_at": "2020-08-06T12:06:09.107204",
	"description": "Lofar Cycle 2",
	"duration": 153,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/15/", "http://localhost:3000/api/cycle_quota/16/", "http://localhost:3000/api/cycle_quota/17/", "http://localhost:3000/api/cycle_quota/18/", "http://localhost:3000/api/cycle_quota/19/", "http://localhost:3000/api/cycle_quota/20/", "http://localhost:3000/api/cycle_quota/21/"],
	"quota_ids": [15, 16, 17, 18, 19, 20, 21],
	"start": "2014-06-01T00:00:00",
	"stop": "2014-11-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.107234",
	"totalProjects": 0,
	"id": "Cycle02",
	"regularProjects": 0,
	"observingTime": 2937,
	"processingTime": 2937,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 183,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 03",
	"url": "http://localhost:3000/api/cycle/Cycle%2003/",
	"created_at": "2020-08-06T12:06:09.120603",
	"description": "Lofar Cycle 3",
	"duration": 212,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/22/", "http://localhost:3000/api/cycle_quota/23/", "http://localhost:3000/api/cycle_quota/24/", "http://localhost:3000/api/cycle_quota/25/", "http://localhost:3000/api/cycle_quota/26/", "http://localhost:3000/api/cycle_quota/27/", "http://localhost:3000/api/cycle_quota/28/"],
	"quota_ids": [22, 23, 24, 25, 26, 27, 28],
	"start": "2014-11-01T00:00:00",
	"stop": "2015-06-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.120634",
	"totalProjects": 0,
	"id": "Cycle03",
	"regularProjects": 0,
	"observingTime": 4070,
	"processingTime": 4070,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 254,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 04",
	"url": "http://localhost:3000/api/cycle/Cycle%2004/",
	"created_at": "2020-08-06T12:06:09.144175",
	"description": "Lofar Cycle 4",
	"duration": 153,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/29/", "http://localhost:3000/api/cycle_quota/30/", "http://localhost:3000/api/cycle_quota/31/", "http://localhost:3000/api/cycle_quota/32/", "http://localhost:3000/api/cycle_quota/33/", "http://localhost:3000/api/cycle_quota/34/", "http://localhost:3000/api/cycle_quota/35/"],
	"quota_ids": [29, 30, 31, 32, 33, 34, 35],
	"start": "2015-06-01T00:00:00",
	"stop": "2015-11-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.144212",
	"totalProjects": 0,
	"id": "Cycle04",
	"regularProjects": 0,
	"observingTime": 2937,
	"processingTime": 2937,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 183,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 05",
	"url": "http://localhost:3000/api/cycle/Cycle%2005/",
	"created_at": "2020-08-06T12:06:09.167378",
	"description": "Lofar Cycle 5",
	"duration": 213,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/36/", "http://localhost:3000/api/cycle_quota/37/", "http://localhost:3000/api/cycle_quota/38/", "http://localhost:3000/api/cycle_quota/39/", "http://localhost:3000/api/cycle_quota/40/", "http://localhost:3000/api/cycle_quota/41/", "http://localhost:3000/api/cycle_quota/42/"],
	"quota_ids": [36, 37, 38, 39, 40, 41, 42],
	"start": "2015-11-01T00:00:00",
	"stop": "2016-06-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.167411",
	"totalProjects": 0,
	"id": "Cycle05",
	"regularProjects": 0,
	"observingTime": 4089,
	"processingTime": 4089,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 255,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 06",
	"url": "http://localhost:3000/api/cycle/Cycle%2006/",
	"created_at": "2020-08-06T12:06:09.199663",
	"description": "Lofar Cycle 6",
	"duration": 153,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/43/", "http://localhost:3000/api/cycle_quota/44/", "http://localhost:3000/api/cycle_quota/45/", "http://localhost:3000/api/cycle_quota/46/", "http://localhost:3000/api/cycle_quota/47/", "http://localhost:3000/api/cycle_quota/48/", "http://localhost:3000/api/cycle_quota/49/"],
	"quota_ids": [43, 44, 45, 46, 47, 48, 49],
	"start": "2016-06-01T00:00:00",
	"stop": "2016-11-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.199698",
	"totalProjects": 0,
	"id": "Cycle06",
	"regularProjects": 0,
	"observingTime": 2937,
	"processingTime": 2937,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 183,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 07",
	"url": "http://localhost:3000/api/cycle/Cycle%2007/",
	"created_at": "2020-08-06T12:06:09.232561",
	"description": "Lofar Cycle 7",
	"duration": 212,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/50/", "http://localhost:3000/api/cycle_quota/51/", "http://localhost:3000/api/cycle_quota/52/", "http://localhost:3000/api/cycle_quota/53/", "http://localhost:3000/api/cycle_quota/54/", "http://localhost:3000/api/cycle_quota/55/", "http://localhost:3000/api/cycle_quota/56/"],
	"quota_ids": [50, 51, 52, 53, 54, 55, 56],
	"start": "2016-11-01T00:00:00",
	"stop": "2017-06-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.232606",
	"totalProjects": 0,
	"id": "Cycle07",
	"regularProjects": 0,
	"observingTime": 4070,
	"processingTime": 0,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 0,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 08",
	"url": "http://localhost:3000/api/cycle/Cycle%2008/",
	"created_at": "2020-08-06T12:06:09.272371",
	"description": "Lofar Cycle 8",
	"duration": 153,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/57/", "http://localhost:3000/api/cycle_quota/58/", "http://localhost:3000/api/cycle_quota/59/", "http://localhost:3000/api/cycle_quota/60/", "http://localhost:3000/api/cycle_quota/61/", "http://localhost:3000/api/cycle_quota/62/", "http://localhost:3000/api/cycle_quota/63/"],
	"quota_ids": [57, 58, 59, 60, 61, 62, 63],
	"start": "2017-06-01T00:00:00",
	"stop": "2017-11-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.272412",
	"totalProjects": 0,
	"id": "Cycle08",
	"regularProjects": 0,
	"observingTime": 0,
	"processingTime": 0,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 0,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 09",
	"url": "http://localhost:3000/api/cycle/Cycle%2009/",
	"created_at": "2020-08-06T12:06:09.302283",
	"description": "Lofar Cycle 9",
	"duration": 212,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/64/", "http://localhost:3000/api/cycle_quota/65/", "http://localhost:3000/api/cycle_quota/66/", "http://localhost:3000/api/cycle_quota/67/", "http://localhost:3000/api/cycle_quota/68/", "http://localhost:3000/api/cycle_quota/69/", "http://localhost:3000/api/cycle_quota/70/"],
	"quota_ids": [64, 65, 66, 67, 68, 69, 70],
	"start": "2017-11-01T00:00:00",
	"stop": "2018-06-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.302325",
	"totalProjects": 0,
	"id": "Cycle09",
	"regularProjects": 0,
	"observingTime": 0,
	"processingTime": 0,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 0,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 10",
	"url": "http://localhost:3000/api/cycle/Cycle%2010/",
	"created_at": "2020-08-06T12:06:09.329227",
	"description": "Lofar Cycle 10",
	"duration": 153,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/71/", "http://localhost:3000/api/cycle_quota/72/", "http://localhost:3000/api/cycle_quota/73/", "http://localhost:3000/api/cycle_quota/74/", "http://localhost:3000/api/cycle_quota/75/", "http://localhost:3000/api/cycle_quota/76/", "http://localhost:3000/api/cycle_quota/77/"],
	"quota_ids": [71, 72, 73, 74, 75, 76, 77],
	"start": "2018-06-01T00:00:00",
	"stop": "2018-11-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.329263",
	"totalProjects": 0,
	"id": "Cycle10",
	"regularProjects": 0,
	"observingTime": 0,
	"processingTime": 0,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 0,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 11",
	"url": "http://localhost:3000/api/cycle/Cycle%2011/",
	"created_at": "2020-08-06T12:06:09.354185",
	"description": "Lofar Cycle 11",
	"duration": 212,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/78/", "http://localhost:3000/api/cycle_quota/79/", "http://localhost:3000/api/cycle_quota/80/", "http://localhost:3000/api/cycle_quota/81/", "http://localhost:3000/api/cycle_quota/82/", "http://localhost:3000/api/cycle_quota/83/", "http://localhost:3000/api/cycle_quota/84/"],
	"quota_ids": [78, 79, 80, 81, 82, 83, 84],
	"start": "2018-11-01T00:00:00",
	"stop": "2019-06-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.354221",
	"totalProjects": 0,
	"id": "Cycle11",
	"regularProjects": 0,
	"observingTime": 0,
	"processingTime": 0,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 0,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 12",
	"url": "http://localhost:3000/api/cycle/Cycle%2012/",
	"created_at": "2020-08-06T12:06:09.381314",
	"description": "Lofar Cycle 12",
	"duration": 153,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/85/", "http://localhost:3000/api/cycle_quota/86/", "http://localhost:3000/api/cycle_quota/87/", "http://localhost:3000/api/cycle_quota/88/", "http://localhost:3000/api/cycle_quota/89/", "http://localhost:3000/api/cycle_quota/90/", "http://localhost:3000/api/cycle_quota/91/"],
	"quota_ids": [85, 86, 87, 88, 89, 90, 91],
	"start": "2019-06-01T00:00:00",
	"stop": "2019-11-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.381349",
	"totalProjects": 0,
	"id": "Cycle12",
	"regularProjects": 0,
	"observingTime": 0,
	"processingTime": 0,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 0,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 13",
	"url": "http://localhost:3000/api/cycle/Cycle%2013/",
	"created_at": "2020-08-06T12:06:09.416511",
	"description": "Lofar Cycle 13",
	"duration": 213,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/92/", "http://localhost:3000/api/cycle_quota/93/", "http://localhost:3000/api/cycle_quota/94/", "http://localhost:3000/api/cycle_quota/95/", "http://localhost:3000/api/cycle_quota/96/", "http://localhost:3000/api/cycle_quota/97/", "http://localhost:3000/api/cycle_quota/98/"],
	"quota_ids": [92, 93, 94, 95, 96, 97, 98],
	"start": "2019-11-01T00:00:00",
	"stop": "2020-06-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.416553",
	"totalProjects": 0,
	"id": "Cycle13",
	"regularProjects": 0,
	"observingTime": 0,
	"processingTime": 0,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 0,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 14",
	"url": "http://localhost:3000/api/cycle/Cycle%2014/",
	"created_at": "2020-08-06T12:06:09.452549",
	"description": "Lofar Cycle 14",
	"duration": 153,
	"projects": ["http://localhost:3000/api/project/TMSS-Commissioning/"],
	"projects_ids": ["TMSS-Commissioning"],
	"quota": ["http://localhost:3000/api/cycle_quota/99/", "http://localhost:3000/api/cycle_quota/100/", "http://localhost:3000/api/cycle_quota/101/", "http://localhost:3000/api/cycle_quota/102/", "http://localhost:3000/api/cycle_quota/103/", "http://localhost:3000/api/cycle_quota/104/", "http://localhost:3000/api/cycle_quota/105/"],
	"quota_ids": [99, 100, 101, 102, 103, 104, 105],
	"start": "2020-06-01T00:00:00",
	"stop": "2020-11-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.452600",
	"totalProjects": 1,
	"id": "Cycle14",
	"regularProjects": 0,
	"observingTime": 0,
	"processingTime": 0,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 0,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 15",
	"url": "http://localhost:3000/api/cycle/Cycle%2015/",
	"created_at": "2020-08-06T12:06:09.487784",
	"description": "Lofar Cycle 15",
	"duration": 212,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/106/", "http://localhost:3000/api/cycle_quota/107/", "http://localhost:3000/api/cycle_quota/108/", "http://localhost:3000/api/cycle_quota/109/", "http://localhost:3000/api/cycle_quota/110/", "http://localhost:3000/api/cycle_quota/111/", "http://localhost:3000/api/cycle_quota/112/"],
	"quota_ids": [106, 107, 108, 109, 110, 111, 112],
	"start": "2020-11-01T00:00:00",
	"stop": "2021-06-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.487826",
	"totalProjects": 0,
	"id": "Cycle15",
	"regularProjects": 0,
	"observingTime": 0,
	"processingTime": 0,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 0,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 16",
	"url": "http://localhost:3000/api/cycle/Cycle%2016/",
	"created_at": "2020-08-06T12:06:09.522741",
	"description": "Lofar Cycle 16",
	"duration": 153,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/113/", "http://localhost:3000/api/cycle_quota/114/", "http://localhost:3000/api/cycle_quota/115/", "http://localhost:3000/api/cycle_quota/116/", "http://localhost:3000/api/cycle_quota/117/", "http://localhost:3000/api/cycle_quota/118/", "http://localhost:3000/api/cycle_quota/119/"],
	"quota_ids": [113, 114, 115, 116, 117, 118, 119],
	"start": "2021-06-01T00:00:00",
	"stop": "2021-11-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.522784",
	"totalProjects": 0,
	"id": "Cycle16",
	"regularProjects": 0,
	"observingTime": 0,
	"processingTime": 0,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 0,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}, {
	"name": "Cycle 17",
	"url": "http://localhost:3000/api/cycle/Cycle%2017/",
	"created_at": "2020-08-06T12:06:09.551738",
	"description": "Lofar Cycle 17",
	"duration": 212,
	"projects": [],
	"projects_ids": [],
	"quota": ["http://localhost:3000/api/cycle_quota/120/", "http://localhost:3000/api/cycle_quota/121/", "http://localhost:3000/api/cycle_quota/122/", "http://localhost:3000/api/cycle_quota/123/", "http://localhost:3000/api/cycle_quota/124/", "http://localhost:3000/api/cycle_quota/125/", "http://localhost:3000/api/cycle_quota/126/"],
	"quota_ids": [120, 121, 122, 123, 124, 125, 126],
	"start": "2021-11-01T00:00:00",
	"stop": "2022-06-01T00:00:00",
	"tags": [],
	"updated_at": "2020-08-06T12:06:09.551771",
	"totalProjects": 0,
	"id": "Cycle17",
	"regularProjects": 0,
	"observingTime": 0,
	"processingTime": 0,
	"ltaResources": 0,
	"support": 0,
	"observingTimeDDT": 0,
	"observingTimePrioA": 0,
	"observingTimePrioB": 0
}];




