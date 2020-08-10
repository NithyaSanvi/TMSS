export default {
    getProjects: {
        "results": [{
            "name": "TMSS-Commissioning",
            "cycles_ids": ["Cycle 14"],
            "private_data": true,
            "project_category": null,
            "project_category_value": null
        }]
    },
    getCycleQuota: {
        "results": [{
            "id": 1,
            "url": "http://localhost:3000/api/cycle_quota/1/",
            "cycle": "http://localhost:3000/api/cycle/Cycle%2000/",
            "cycle_id": "Cycle 00",
            "resource_type": "http://localhost:3000/api/resource_type/observing_time/",
            "resource_type_id": "observing_time",
            "value": 10575360.0
        },{
            "cycle": "http://localhost:3000/api/cycle/Cycle%2000/",
            "cycle_id": "Cycle 00",
            "id": 5,
            "resource_type": "http://localhost:3000/api/resource_type/observing_time_commissioning/",
            "resource_type_id": "observing_time_commissioning",
            "url": "http://localhost:3000/api/cycle_quota/5/",
            "value": 660960
        }]
    },
    getAllCycle: {
        "results": [{
            "name": "Cycle 00",
            "url": "http://localhost:3000/api/cycle/Cycle%2000/",
            "created_at": "2020-08-06T12:06:09.074400",
            "description": "Lofar Cycle 0",
            "duration": 13219200.0,
            "projects": [],
            "projects_ids": [],
            "quota": ["http://localhost:3000/api/cycle_quota/1/", "http://localhost:3000/api/cycle_quota/2/", "http://localhost:3000/api/cycle_quota/3/", "http://localhost:3000/api/cycle_quota/4/", "http://localhost:3000/api/cycle_quota/5/", "http://localhost:3000/api/cycle_quota/6/", "http://localhost:3000/api/cycle_quota/7/"],
            "quota_ids": [1, 2, 3, 4, 5, 6, 7],
            "start": "2013-06-01T00:00:00",
            "stop": "2013-11-01T00:00:00",
            "tags": [],
            "updated_at": "2020-08-06T12:06:09.074437"
        }, {
            "name": "Cycle 01",
            "url": "http://localhost:3000/api/cycle/Cycle%2001/",
            "created_at": "2020-08-06T12:06:09.093253",
            "description": "Lofar Cycle 1",
            "duration": 18316800.0,
            "projects": [],
            "projects_ids": [],
            "quota": ["http://localhost:3000/api/cycle_quota/8/", "http://localhost:3000/api/cycle_quota/9/", "http://localhost:3000/api/cycle_quota/10/", "http://localhost:3000/api/cycle_quota/11/", "http://localhost:3000/api/cycle_quota/12/", "http://localhost:3000/api/cycle_quota/13/", "http://localhost:3000/api/cycle_quota/14/"],
            "quota_ids": [8, 9, 10, 11, 12, 13, 14],
            "start": "2013-11-01T00:00:00",
            "stop": "2014-06-01T00:00:00",
            "tags": [],
            "updated_at": "2020-08-06T12:06:09.093283"
        }, {
            "name": "Cycle 02",
            "url": "http://localhost:3000/api/cycle/Cycle%2002/",
            "created_at": "2020-08-06T12:06:09.107204",
            "description": "Lofar Cycle 2",
            "duration": 13219200.0,
            "projects": [],
            "projects_ids": [],
            "quota": ["http://localhost:3000/api/cycle_quota/15/", "http://localhost:3000/api/cycle_quota/16/", "http://localhost:3000/api/cycle_quota/17/", "http://localhost:3000/api/cycle_quota/18/", "http://localhost:3000/api/cycle_quota/19/", "http://localhost:3000/api/cycle_quota/20/", "http://localhost:3000/api/cycle_quota/21/"],
            "quota_ids": [15, 16, 17, 18, 19, 20, 21],
            "start": "2014-06-01T00:00:00",
            "stop": "2014-11-01T00:00:00",
            "tags": [],
            "updated_at": "2020-08-06T12:06:09.107234"
        }]
    },
    getresources: {
        "results": [{
            "name": "lta_storage",
            "url": "http://localhost:3000/api/resource_type/lta_storage/",
            "created_at": "2020-08-10T11:33:27.742938",
            "description": "Amount of storage in the LTA (in bytes)",
            "quantity": "http://localhost:3000/api/quantity/bytes/",
            "quantity_value": "bytes",
            "tags": [],
            "updated_at": "2020-08-10T11:33:27.742956"
        }, {
            "name": "cep_storage",
            "url": "http://localhost:3000/api/resource_type/cep_storage/",
            "created_at": "2020-08-10T11:33:27.747482",
            "description": "Amount of storage on the CEP processing cluster (in bytes)",
            "quantity": "http://localhost:3000/api/quantity/bytes/",
            "quantity_value": "bytes",
            "tags": [],
            "updated_at": "2020-08-10T11:33:27.747498"
        }, {
            "name": "cep_processing_time",
            "url": "http://localhost:3000/api/resource_type/cep_processing_time/",
            "created_at": "2020-08-10T11:33:27.751195",
            "description": "Processing time on the CEP processing cluster (in seconds)",
            "quantity": "http://localhost:3000/api/quantity/time/",
            "quantity_value": "time",
            "tags": [],
            "updated_at": "2020-08-10T11:33:27.751218"
        }, {
            "name": "observing_time",
            "url": "http://localhost:3000/api/resource_type/observing_time/",
            "created_at": "2020-08-10T11:33:27.754681",
            "description": "Observing time (in seconds)",
            "quantity": "http://localhost:3000/api/quantity/time/",
            "quantity_value": "time",
            "tags": [],
            "updated_at": "2020-08-10T11:33:27.754705"
        }, {
            "name": "observing_time_prio_a",
            "url": "http://localhost:3000/api/resource_type/observing_time_prio_a/",
            "created_at": "2020-08-10T11:33:27.758486",
            "description": "Observing time with priority A (in seconds)",
            "quantity": "http://localhost:3000/api/quantity/time/",
            "quantity_value": "time",
            "tags": [],
            "updated_at": "2020-08-10T11:33:27.758511"
        }, {
            "name": "observing_time_prio_b",
            "url": "http://localhost:3000/api/resource_type/observing_time_prio_b/",
            "created_at": "2020-08-10T11:33:27.762276",
            "description": "Observing time with priority B (in seconds)",
            "quantity": "http://localhost:3000/api/quantity/time/",
            "quantity_value": "time",
            "tags": [],
            "updated_at": "2020-08-10T11:33:27.762296"
        }, {
            "name": "observing_time_commissioning",
            "url": "http://localhost:3000/api/resource_type/observing_time_commissioning/",
            "created_at": "2020-08-10T11:33:27.765809",
            "description": "Observing time for Commissioning/DDT (in seconds)",
            "quantity": "http://localhost:3000/api/quantity/time/",
            "quantity_value": "time",
            "tags": [],
            "updated_at": "2020-08-10T11:33:27.765834"
        }, {
            "name": "support_time",
            "url": "http://localhost:3000/api/resource_type/support_time/",
            "created_at": "2020-08-10T11:33:27.769402",
            "description": "Support time by human (in seconds)",
            "quantity": "http://localhost:3000/api/quantity/time/",
            "quantity_value": "time",
            "tags": [],
            "updated_at": "2020-08-10T11:33:27.769427"
        }, {
            "name": "number_of_triggers",
            "url": "http://localhost:3000/api/resource_type/number_of_triggers/",
            "created_at": "2020-08-10T11:33:27.773406",
            "description": "Number of trigger events (as integer)",
            "quantity": "http://localhost:3000/api/quantity/number/",
            "quantity_value": "number",
            "tags": [],
            "updated_at": "2020-08-10T11:33:27.773434"
        }]
    }
}