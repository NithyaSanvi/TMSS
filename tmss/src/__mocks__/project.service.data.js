
const ProjectServiceMock= {
    project_categories: [{url: "Regular", value: 'Regular'}, {url: "User Shared Support", value: 'User Shared Support'}],
    period_categories: [{url: "Single Cycle", value: 'Single Cycle'}, {url: "Long Term", value: 'Long Term'}],
    resources: [{
        "name": "LOFAR Observing Time",
        "url": "http://localhost:3000/api/resource_type/LOFAR%20Observing%20Time/",
        "created_at": "2020-07-29T07:31:21.708296",
        "description": "LOFAR Observing Time",
        "resource_unit": "http://localhost:3000/api/resource_unit/second/",
        "resource_unit_id": "second",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:21.708316",
        "resourceUnit": {
            "name": "second",
            "url": "http://localhost:3000/api/resource_unit/second/",
            "created_at": "2020-07-29T07:31:21.070088",
            "description": "Unit of time or duration",
            "tags": [
            ],
            "updated_at": "2020-07-29T07:31:21.070114"
        }
    },
    {
        "name": "LOFAR Observing Time prio A",
        "url": "http://localhost:3000/api/resource_type/LOFAR%20Observing%20Time%20prio%20A/",
        "created_at": "2020-07-29T07:31:21.827537",
        "description": "LOFAR Observing Time prio A",
        "resource_unit": "http://localhost:3000/api/resource_unit/second/",
        "resource_unit_id": "second",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:21.827675",
        "resourceUnit": {
            "name": "second",
            "url": "http://localhost:3000/api/resource_unit/second/",
            "created_at": "2020-07-29T07:31:21.070088",
            "description": "Unit of time or duration",
            "tags": [
            ],
            "updated_at": "2020-07-29T07:31:21.070114"
        }
    },
    {
        "name": "LOFAR Observing Time prio B",
        "url": "http://localhost:3000/api/resource_type/LOFAR%20Observing%20Time%20prio%20B/",
        "created_at": "2020-07-29T07:31:21.950948",
        "description": "LOFAR Observing Time prio B",
        "resource_unit": "http://localhost:3000/api/resource_unit/second/",
        "resource_unit_id": "second",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:21.950968",
        "resourceUnit": {
            "name": "second",
            "url": "http://localhost:3000/api/resource_unit/second/",
            "created_at": "2020-07-29T07:31:21.070088",
            "description": "Unit of time or duration",
            "tags": [
            ],
            "updated_at": "2020-07-29T07:31:21.070114"
        }
    },
    {
        "name": "CEP Processing Time",
        "url": "http://localhost:3000/api/resource_type/CEP%20Processing%20Time/",
        "created_at": "2020-07-29T07:31:22.097916",
        "description": "CEP Processing Time",
        "resource_unit": "http://localhost:3000/api/resource_unit/second/",
        "resource_unit_id": "second",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:22.097941",
        "resourceUnit": {
            "name": "second",
            "url": "http://localhost:3000/api/resource_unit/second/",
            "created_at": "2020-07-29T07:31:21.070088",
            "description": "Unit of time or duration",
            "tags": [
            ],
            "updated_at": "2020-07-29T07:31:21.070114"
        }
    },
    {
        "name": "LTA Storage",
        "url": "http://localhost:3000/api/resource_type/LTA%20Storage/",
        "created_at": "2020-07-29T07:31:22.210071",
        "description": "LTA Storage",
        "resource_unit": "http://localhost:3000/api/resource_unit/byte/",
        "resource_unit_id": "byte",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:22.210091",
        "resourceUnit": {
            "name": "byte",
            "url": "http://localhost:3000/api/resource_unit/byte/",
            "created_at": "2020-07-29T07:31:21.500997",
            "description": "Unit of data storage",
            "tags": [
            ],
            "updated_at": "2020-07-29T07:31:21.501028"
        }
    },
    {
        "name": "Number of triggers",
        "url": "http://localhost:3000/api/resource_type/Number%20of%20triggers/",
        "created_at": "2020-07-29T07:31:22.317313",
        "description": "Number of triggers",
        "resource_unit": "http://localhost:3000/api/resource_unit/number/",
        "resource_unit_id": "number",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:22.317341",
        "resourceUnit": {
            "name": "number",
            "url": "http://localhost:3000/api/resource_unit/number/",
            "created_at": "2020-07-29T07:31:21.596364",
            "description": "Unit of count",
            "tags": [
            ],
            "updated_at": "2020-07-29T07:31:21.596385"
        }
    },
    {
        "name": "LOFAR Support Time",
        "url": "http://localhost:3000/api/resource_type/LOFAR%20Support%20Time/",
        "created_at": "2020-07-29T07:31:22.437945",
        "description": "LOFAR Support Time",
        "resource_unit": "http://localhost:3000/api/resource_unit/second/",
        "resource_unit_id": "second",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:22.437964",
        "resourceUnit": {
            "name": "second",
            "url": "http://localhost:3000/api/resource_unit/second/",
            "created_at": "2020-07-29T07:31:21.070088",
            "description": "Unit of time or duration",
            "tags": [
            ],
            "updated_at": "2020-07-29T07:31:21.070114"
        }
    },
    {
        "name": "LOFAR Support hours",
        "url": "http://localhost:3000/api/resource_type/LOFAR%20Support%20hours/",
        "created_at": "2020-07-29T07:31:22.571850",
        "description": "LOFAR Support hours",
        "resource_unit": "http://localhost:3000/api/resource_unit/second/",
        "resource_unit_id": "second",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:22.571869",
        "resourceUnit": {
            "name": "second",
            "url": "http://localhost:3000/api/resource_unit/second/",
            "created_at": "2020-07-29T07:31:21.070088",
            "description": "Unit of time or duration",
            "tags": [
            ],
            "updated_at": "2020-07-29T07:31:21.070114"
        }
    },
    {
        "name": "Support hours",
        "url": "http://localhost:3000/api/resource_type/Support%20hours/",
        "created_at": "2020-07-29T07:31:22.694438",
        "description": "Support hours",
        "resource_unit": "http://localhost:3000/api/resource_unit/second/",
        "resource_unit_id": "second",
        "tags": [
        ],
        "updated_at": "2020-07-29T07:31:22.694514",
        "resourceUnit": {
            "name": "second",
            "url": "http://localhost:3000/api/resource_unit/second/",
            "created_at": "2020-07-29T07:31:21.070088",
            "description": "Unit of time or duration",
            "tags": [
            ],
            "updated_at": "2020-07-29T07:31:21.070114"
        }
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
        "project_quota": [
          "http://192.168.99.100:8008/api/project_quota/70/",
          "http://192.168.99.100:8008/api/project_quota/71/",
          "http://192.168.99.100:8008/api/project_quota/72/",
          "http://192.168.99.100:8008/api/project_quota/73/",
          "http://192.168.99.100:8008/api/project_quota/74/",
          "http://192.168.99.100:8008/api/project_quota/75/",
          "http://192.168.99.100:8008/api/project_quota/76/",
          "http://192.168.99.100:8008/api/project_quota/77/"
        ],
        "project_quota_ids": [
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
          "value": 8
        }
      ]
}

export default ProjectServiceMock;