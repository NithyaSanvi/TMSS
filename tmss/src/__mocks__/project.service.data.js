

const ProjectServiceMock= {
    project_categories: [{url: "Regular", value: 'Regular'}, {url: "User Shared Support", value: 'User Shared Support'}],
    period_categories: [{url: "Single Cycle", value: 'Single Cycle'}, {url: "Long Term", value: 'Long Term'}],
    resources: [{
        "name": "LOFAR Observing Time",
        "url": "http://localhost:3000/api/resource_type/LOFAR%20Observing%20Time/",
        "created_at": "2020-07-29T07:31:21.708296",
        "description": "LOFAR Observing Time",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:21.708316",
        "quantity_value": "time"
    },
    {
        "name": "LOFAR Observing Time prio A",
        "url": "http://localhost:3000/api/resource_type/LOFAR%20Observing%20Time%20prio%20A/",
        "created_at": "2020-07-29T07:31:21.827537",
        "description": "LOFAR Observing Time prio A",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:21.827675",
        "quantity_value": "time"
    },
    {
        "name": "LOFAR Observing Time prio B",
        "url": "http://localhost:3000/api/resource_type/LOFAR%20Observing%20Time%20prio%20B/",
        "created_at": "2020-07-29T07:31:21.950948",
        "description": "LOFAR Observing Time prio B",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:21.950968",
        "quantity_value": "time"
    },
    {
        "name": "CEP Processing Time",
        "url": "http://localhost:3000/api/resource_type/CEP%20Processing%20Time/",
        "created_at": "2020-07-29T07:31:22.097916",
        "description": "CEP Processing Time",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:22.097941",
        "quantity_value": "time"
    },
    {
        "name": "LTA Storage",
        "url": "http://localhost:3000/api/resource_type/LTA%20Storage/",
        "created_at": "2020-07-29T07:31:22.210071",
        "description": "LTA Storage",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:22.210091",
        "quantity_value": "bytes"
    },
    {
        "name": "Number of triggers",
        "url": "http://localhost:3000/api/resource_type/Number%20of%20triggers/",
        "created_at": "2020-07-29T07:31:22.317313",
        "description": "Number of triggers",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:22.317341",
        "quantity_value": "number"
    },
    {
        "name": "LOFAR Support Time",
        "url": "http://localhost:3000/api/resource_type/LOFAR%20Support%20Time/",
        "created_at": "2020-07-29T07:31:22.437945",
        "description": "LOFAR Support Time",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:22.437964",
        "quantity_value": "time"
    },
    {
        "name": "LOFAR Support hours",
        "url": "http://localhost:3000/api/resource_type/LOFAR%20Support%20hours/",
        "created_at": "2020-07-29T07:31:22.571850",
        "description": "LOFAR Support hours",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:22.571869",
        "quantity_value": "time"
    },
    {
        "name": "Support hours",
        "url": "http://localhost:3000/api/resource_type/Support%20hours/",
        "created_at": "2020-07-29T07:31:22.694438",
        "description": "Support hours",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:22.694514",
        "quantity_value": "time"
    }
    ],
    projectResourceDefaults: {
        'LOFAR Observing Time': 3600, 
        'LOFAR Observing Time prio A': 3600, 
        'LOFAR Observing Time prio B': 3600,
        'CEP Processing Time': 3600,
        'LTA Storage': 1024*1024*1024*1024,
        'Number of triggers': 1,
        'LOFAR Support Time': 3600
    },
    project: [{
        "name": "OSR-11",
        "url": "http://192.168.99.100:8008/api/project/OSR-11/",
        "can_trigger": true,
        "created_at": "2020-07-29T18:20:06.187276",
        "cycles": [
          "http://192.168.99.100:8008/api/cycle/Cycle%200/"
        ],
        "cycles_ids": [
          "Cycle 0"
        ],
        "description": "OSR-11",
        "expert": false,
        "filler": false,
        "period_category": "Single Cycle",
        "period_category_value": "Single Cycle",
        "priority_rank": 5,
        "private_data": true,
        "project_category": "Regular",
        "project_category_value": "Regular",
        "quota": [
          "http://192.168.99.100:8008/api/project_quota/70/",
          "http://192.168.99.100:8008/api/project_quota/71/",
          "http://192.168.99.100:8008/api/project_quota/72/",
          "http://192.168.99.100:8008/api/project_quota/73/",
          "http://192.168.99.100:8008/api/project_quota/74/",
          "http://192.168.99.100:8008/api/project_quota/75/",
          "http://192.168.99.100:8008/api/project_quota/76/",
          "http://192.168.99.100:8008/api/project_quota/77/"
        ],
        "quota_ids": [
          70,
          71,
          72,
          73,
          74,
          75,
          76,
          77
        ],
        "tags": [],
        "trigger_priority": 990,
        "updated_at": "2020-07-29T18:20:06.187342"
    }],
    projectQuota: [
        {
          "id": 70,
          "url": "http://192.168.99.100:8008/api/project_quota/70/",
          "project": "http://192.168.99.100:8008/api/project/OSR-11/",
          "project_id": "OSR-11",
          "resource_type": "http://192.168.99.100:8008/api/resource_type/CEP%20Processing%20Time/",
          "resource_type_id": "CEP Processing Time",
          "value": 36000
        },
        {
          "id": 71,
          "url": "http://192.168.99.100:8008/api/project_quota/71/",
          "project": "http://192.168.99.100:8008/api/project/OSR-11/",
          "project_id": "OSR-11",
          "resource_type": "http://192.168.99.100:8008/api/resource_type/LOFAR%20Observing%20Time/",
          "resource_type_id": "LOFAR Observing Time",
          "value": 72000
        },
        {
          "id": 72,
          "url": "http://192.168.99.100:8008/api/project_quota/72/",
          "project": "http://192.168.99.100:8008/api/project/OSR-11/",
          "project_id": "OSR-11",
          "resource_type": "http://192.168.99.100:8008/api/resource_type/LOFAR%20Observing%20Time%20prio%20A/",
          "resource_type_id": "LOFAR Observing Time prio A",
          "value": 108000
        },
        {
          "id": 73,
          "url": "http://192.168.99.100:8008/api/project_quota/73/",
          "project": "http://192.168.99.100:8008/api/project/OSR-11/",
          "project_id": "OSR-11",
          "resource_type": "http://192.168.99.100:8008/api/resource_type/LOFAR%20Observing%20Time%20prio%20B/",
          "resource_type_id": "LOFAR Observing Time prio B",
          "value": 144000
        },
        {
          "id": 74,
          "url": "http://192.168.99.100:8008/api/project_quota/74/",
          "project": "http://192.168.99.100:8008/api/project/OSR-11/",
          "project_id": "OSR-11",
          "resource_type": "http://192.168.99.100:8008/api/resource_type/LOFAR%20Support%20Time/",
          "resource_type_id": "LOFAR Support Time",
          "value": 180000
        },
        {
          "id": 75,
          "url": "http://192.168.99.100:8008/api/project_quota/75/",
          "project": "http://192.168.99.100:8008/api/project/OSR-11/",
          "project_id": "OSR-11",
          "resource_type": "http://192.168.99.100:8008/api/resource_type/LTA%20Storage/",
          "resource_type_id": "LTA Storage",
          "value": 6597069766656
        },
        {
          "id": 76,
          "url": "http://192.168.99.100:8008/api/project_quota/76/",
          "project": "http://192.168.99.100:8008/api/project/OSR-11/",
          "project_id": "OSR-11",
          "resource_type": "http://192.168.99.100:8008/api/resource_type/Number%20of%20triggers/",
          "resource_type_id": "Number of triggers",
          "value": 7
        },
        {
          "id": 77,
          "url": "http://192.168.99.100:8008/api/project_quota/77/",
          "project": "http://192.168.99.100:8008/api/project/OSR-11/",
          "project_id": "OSR-11",
          "resource_type": "http://192.168.99.100:8008/api/resource_type/Support%20hours/",
          "resource_type_id": "Support hours",
          "value": 32400
        }
      ],
    projectList: [
      {
        "name": "OSR-01",
        "url": "http://192.168.99.100:8008/api/project/OSR-01",
        "can_trigger": false,
        "created_at": "2020-08-25T14:29:04.881620",
        "cycles": [
          "http://192.168.99.100:8008/api/cycle/Cycle%2014"
        ],
        "cycles_ids": [
          "Cycle 14"
        ],
        "description": "OSR-01",
        "expert": false,
        "filler": false,
        "period_category": "http://192.168.99.100:8008/api/period_category/single_cycle",
        "period_category_value": "single_cycle",
        "priority_rank": 1,
        "private_data": true,
        "project_category": "http://192.168.99.100:8008/api/project_category/regular",
        "project_category_value": "regular",
        "quota": [
          "http://192.168.99.100:8008/api/project_quota/1",
          "http://192.168.99.100:8008/api/project_quota/2",
          "http://192.168.99.100:8008/api/project_quota/3",
          "http://192.168.99.100:8008/api/project_quota/4",
          "http://192.168.99.100:8008/api/project_quota/5",
          "http://192.168.99.100:8008/api/project_quota/6",
          "http://192.168.99.100:8008/api/project_quota/7"
        ],
        "quota_ids": [
          1,
          2,
          3,
          4,
          5,
          6,
          7
        ],
        "tags": [],
        "trigger_priority": 1000,
        "updated_at": "2020-08-25T14:29:04.881640"
      },
      {
        "name": "OSR-02",
        "url": "http://192.168.99.100:8008/api/project/OSR-02",
        "can_trigger": false,
        "created_at": "2020-08-28T07:52:07.411136",
        "cycles": [],
        "cycles_ids": [],
        "description": "OSR-02",
        "expert": false,
        "filler": false,
        "period_category": null,
        "period_category_value": null,
        "priority_rank": 1,
        "private_data": true,
        "project_category": null,
        "project_category_value": null,
        "quota": [
          "http://192.168.99.100:8008/api/project_quota/8",
          "http://192.168.99.100:8008/api/project_quota/9",
          "http://192.168.99.100:8008/api/project_quota/10",
          "http://192.168.99.100:8008/api/project_quota/11",
          "http://192.168.99.100:8008/api/project_quota/12",
          "http://192.168.99.100:8008/api/project_quota/13",
          "http://192.168.99.100:8008/api/project_quota/14"
        ],
        "quota_ids": [
          8,
          9,
          10,
          11,
          12,
          13,
          14
        ],
        "tags": [],
        "trigger_priority": 1000,
        "updated_at": "2020-08-28T07:52:07.411167"
      },
      {
        "name": "TMSS-Commissioning",
        "url": "http://192.168.99.100:8008/api/project/TMSS-Commissioning",
        "can_trigger": false,
        "created_at": "2020-08-25T13:28:34.760707",
        "cycles": [
          "http://192.168.99.100:8008/api/cycle/Cycle%2014"
        ],
        "cycles_ids": [
          "Cycle 14"
        ],
        "description": "Project for all TMSS tests and commissioning",
        "expert": true,
        "filler": false,
        "period_category": null,
        "period_category_value": null,
        "priority_rank": 1,
        "private_data": true,
        "project_category": null,
        "project_category_value": null,
        "quota": [],
        "quota_ids": [],
        "tags": [],
        "trigger_priority": 1000,
        "updated_at": "2020-08-25T13:28:34.760729"
      }
    ]
}

        
     

export default ProjectServiceMock;