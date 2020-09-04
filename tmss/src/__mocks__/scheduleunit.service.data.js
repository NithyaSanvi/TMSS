const SUServiceMock= {
    scheduleSetList: [
        {
          "id": 1,
          "url": "http://192.168.99.100:8008/api/scheduling_set/1",
          "created_at": "2020-08-25T13:28:42.045214",
          "description": "",
          "generator_doc": {},
          "generator_source": null,
          "generator_source_id": null,
          "generator_template": "http://192.168.99.100:8008/api/generator_template/1",
          "generator_template_id": 1,
          "name": "Test Scheduling Set UC1 example 0",
          "project": "http://192.168.99.100:8008/api/project/TMSS-Commissioning",
          "project_id": "TMSS-Commissioning",
          "scheduling_unit_drafts": [
            "http://192.168.99.100:8008/api/scheduling_unit_draft/2",
            "http://192.168.99.100:8008/api/scheduling_unit_draft/1"
          ],
          "scheduling_unit_drafts_ids": [
            2,
            1
          ],
          "tags": [
            "TEST",
            "UC1"
          ],
          "updated_at": "2020-08-25T13:28:42.047512"
        },
        {
          "id": 2,
          "url": "http://192.168.99.100:8008/api/scheduling_set/2",
          "created_at": "2020-08-25T13:28:49.545042",
          "description": "",
          "generator_doc": {},
          "generator_source": null,
          "generator_source_id": null,
          "generator_template": "http://192.168.99.100:8008/api/generator_template/2",
          "generator_template_id": 2,
          "name": "Test Scheduling Set UC1 example 1",
          "project": "http://192.168.99.100:8008/api/project/TMSS-Commissioning",
          "project_id": "TMSS-Commissioning",
          "scheduling_unit_drafts": [
            "http://192.168.99.100:8008/api/scheduling_unit_draft/4",
            "http://192.168.99.100:8008/api/scheduling_unit_draft/3"
          ],
          "scheduling_unit_drafts_ids": [
            4,
            3
          ],
          "tags": [
            "TEST",
            "UC1"
          ],
          "updated_at": "2020-08-25T13:28:49.546151"
        },
        {
          "id": 3,
          "url": "http://192.168.99.100:8008/api/scheduling_set/3",
          "created_at": "2020-08-25T13:28:57.025339",
          "description": "",
          "generator_doc": {},
          "generator_source": null,
          "generator_source_id": null,
          "generator_template": "http://192.168.99.100:8008/api/generator_template/3",
          "generator_template_id": 3,
          "name": "Test Scheduling Set UC1 example 2",
          "project": "http://192.168.99.100:8008/api/project/TMSS-Commissioning",
          "project_id": "TMSS-Commissioning",
          "scheduling_unit_drafts": [
            "http://192.168.99.100:8008/api/scheduling_unit_draft/6",
            "http://192.168.99.100:8008/api/scheduling_unit_draft/5"
          ],
          "scheduling_unit_drafts_ids": [
            6,
            5
          ],
          "tags": [
            "TEST",
            "UC1"
          ],
          "updated_at": "2020-08-25T13:28:57.026492"
        }
      ],
    observStrategies: [
        {
          "id": 1,
          "url": "http://192.168.99.100:8008/api/scheduling_unit_observing_strategy_template/1",
          "created_at": "2020-08-25T13:28:33.974187",
          "description": "UC1 observation strategy template",
          "name": "UC1 observation strategy template",
          "scheduling_unit_template": "http://192.168.99.100:8008/api/scheduling_unit_template/1",
          "scheduling_unit_template_id": 1,
          "tags": [
            "UC1"
          ],
          "template": {
            "tasks": {
              "Pipeline 1": {
                "tags": [],
                "description": "Preprocessing Pipeline for Calibrator Observation 1",
                "specifications_doc": {
                  "flag": {
                    "rfi_strategy": "auto",
                    "outerchannels": true,
                    "autocorrelations": true
                  },
                  "demix": {
                    "sources": {},
                    "time_steps": 10,
                    "ignore_target": false,
                    "frequency_steps": 64
                  },
                  "average": {
                    "time_steps": 1,
                    "frequency_steps": 4
                  },
                  "storagemanager": "dysco"
                },
                "specifications_template": "preprocessing schema"
              },
              "Pipeline 2": {
                "tags": [],
                "description": "Preprocessing Pipeline for Calibrator Observation 2",
                "specifications_doc": {
                  "flag": {
                    "rfi_strategy": "auto",
                    "outerchannels": true,
                    "autocorrelations": true
                  },
                  "demix": {
                    "sources": {},
                    "time_steps": 10,
                    "ignore_target": false,
                    "frequency_steps": 64
                  },
                  "average": {
                    "time_steps": 1,
                    "frequency_steps": 4
                  },
                  "storagemanager": "dysco"
                },
                "specifications_template": "preprocessing schema"
              },
              "Pipeline SAP0": {
                "tags": [],
                "description": "Preprocessing Pipeline for Target Observation SAP0",
                "specifications_doc": {
                  "flag": {
                    "rfi_strategy": "auto",
                    "outerchannels": true,
                    "autocorrelations": true
                  },
                  "demix": {
                    "sources": {},
                    "time_steps": 10,
                    "ignore_target": false,
                    "frequency_steps": 64
                  },
                  "average": {
                    "time_steps": 1,
                    "frequency_steps": 4
                  },
                  "storagemanager": "dysco"
                },
                "specifications_template": "preprocessing schema"
              },
              "Pipeline SAP1": {
                "tags": [],
                "description": "Preprocessing Pipeline for Target Observation SAP1",
                "specifications_doc": {
                  "flag": {
                    "rfi_strategy": "auto",
                    "outerchannels": true,
                    "autocorrelations": true
                  },
                  "demix": {
                    "sources": {},
                    "time_steps": 10,
                    "ignore_target": false,
                    "frequency_steps": 64
                  },
                  "average": {
                    "time_steps": 1,
                    "frequency_steps": 4
                  },
                  "storagemanager": "dysco"
                },
                "specifications_template": "preprocessing schema"
              },
              "Target Observation": {
                "tags": [],
                "description": "Target Observation for UC1 HBA scheduling unit",
                "specifications_doc": {
                  "QA": {
                    "plots": {
                      "enabled": true,
                      "autocorrelation": true,
                      "crosscorrelation": true
                    },
                    "file_conversion": {
                      "enabled": true,
                      "nr_of_subbands": -1,
                      "nr_of_timestamps": 256
                    }
                  },
                  "SAPs": [
                    {
                      "name": "target0",
                      "subbands": [
                        349,
                        372
                      ],
                      "digital_pointing": {
                        "angle1": 3.9935314947195253,       
                        "angle2": 0.5324708659626034,       
                        "angle3": 24,
                        "direction_type": "J2000"
                      }
                    },
                    {
                      "name": "target1",
                      "subbands": [
                        349,
                        372
                      ],
                      "digital_pointing": {
                        "angle1": 3.9935314947195253,       
                        "angle2": 0.5324708659626034,       
                        "angle3": 24,
                        "direction_type": "J2000"
                      }
                    }
                  ],
                  "filter": "HBA_110_190",
                  "duration": 28800,
                  "stations": [
                    {
                      "group": "ALL",
                      "min_stations": 1
                    }
                  ],
                  "tile_beam": {
                    "angle1": 5.324708659626033,        
                    "angle2": 0.7099611546168045,       
                    "angle3": 42,
                    "direction_type": "J2000"
                  },
                  "correlator": {
                    "storage_cluster": "CEP4",
                    "integration_time": 1,
                    "channels_per_subband": 64
                  },
                  "antenna_set": "HBA_DUAL_INNER"
                },
                "specifications_template": "observation schema"
              },
              "Calibrator Observation 1": {
                "tags": [],
                "description": "Calibrator Observation for UC1 HBA scheduling unit",
                "specifications_doc": {
                  "duration": 600,
                  "pointing": {
                    "angle1": 0,
                    "angle2": 0,
                    "angle3": 0,
                    "direction_type": "J2000"
                  },
                  "autoselect": false
                },
                "specifications_template": "calibrator schema"
              },
              "Calibrator Observation 2": {
                "tags": [],
                "description": "Calibrator Observation for UC1 HBA scheduling unit",
                "specifications_doc": {
                  "duration": 600,
                  "pointing": {
                    "angle1": 0,
                    "angle2": 0,
                    "angle3": 0,
                    "direction_type": "J2000"
                  },
                  "autoselect": false
                },
                "specifications_template": "calibrator schema"
              }
            },
            "parameters": [
              {
                "name": "Target Pointing 0",
                "refs": [
                  "#/tasks/Target Observation/specifications_doc/SAPs/0/digital_pointing"
                ]
              },
              {
                "name": "Target Pointing 1",
                "refs": [
                  "#/tasks/Target Observation/specifications_doc/SAPs/1/digital_pointing"
                ]
              },
              {
                "name": "Tile Beam",
                "refs": [
                  "#/tasks/Target Observation/specifications_doc/tile_beam"
                ]
              }
            ],
            "task_relations": [
              {
                "tags": [],
                "input": {
                  "role": "input",
                  "datatype": "visibilities"
                },
                "output": {
                  "role": "correlator",
                  "datatype": "visibilities"
                },
                "consumer": "Pipeline 1",
                "producer": "Calibrator Observation 1",
                "dataformat": "MeasurementSet",
                "selection_doc": {},
                "selection_template": "All"
              },
              {
                "tags": [],
                "input": {
                  "role": "input",
                  "datatype": "visibilities"
                },
                "output": {
                  "role": "correlator",
                  "datatype": "visibilities"
                },
                "consumer": "Pipeline 2",
                "producer": "Calibrator Observation 2",
                "dataformat": "MeasurementSet",
                "selection_doc": {},
                "selection_template": "All"
              },
              {
                "tags": [],
                "input": {
                  "role": "input",
                  "datatype": "visibilities"
                },
                "output": {
                  "role": "correlator",
                  "datatype": "visibilities"
                },
                "consumer": "Pipeline SAP0",
                "producer": "Target Observation",
                "dataformat": "MeasurementSet",
                "selection_doc": {
                  "sap": [
                    0
                  ]
                },
                "selection_template": "SAP"
              },
              {
                "tags": [],
                "input": {
                  "role": "input",
                  "datatype": "visibilities"
                },
                "output": {
                  "role": "correlator",
                  "datatype": "visibilities"
                },
                "consumer": "Pipeline SAP1",
                "producer": "Target Observation",
                "dataformat": "MeasurementSet",
                "selection_doc": {
                  "sap": [
                    1
                  ]
                },
                "selection_template": "SAP"
              }
            ],
            "task_scheduling_relations": [
              {
                "first": "Calibrator Observation 1",
                "second": "Target Observation",
                "placement": "before",
                "time_offset": 60
              },
              {
                "first": "Calibrator Observation 2",
                "second": "Target Observation",
                "placement": "after",
                "time_offset": 60
              }
            ]
          },
          "updated_at": "2020-08-25T13:28:33.974209",
          "version": "0.1"
        }
      ],
    schedulingUnitFromObservStrategy: {
        "id": 1,
        "url": "http://192.168.99.100:8008/api/scheduling_unit_draft/1",
        "copies": null,
        "copies_id": null,
        "copy_reason": null,
        "copy_reason_value": null,
        "created_at": "2020-08-25T13:28:42.092602",
        "description": "",
        "duration": 30120,
        "generator_instance_doc": null,
        "name": "UC1 test scheduling unit 1.1",
        "observation_strategy_template": "http://192.168.99.100:8008/api/scheduling_unit_observing_strategy_template/1",
        "observation_strategy_template_id": 1,
        "requirements_doc": {
          "tasks": {
            "Pipeline 1": {
              "tags": [],
              "description": "Preprocessing Pipeline for Calibrator Observation 1",
              "specifications_doc": {
                "flag": {
                  "rfi_strategy": "auto",
                  "outerchannels": true,
                  "autocorrelations": true
                },
                "demix": {
                  "sources": {},
                  "time_steps": 10,
                  "ignore_target": false,
                  "frequency_steps": 64
                },
                "average": {
                  "time_steps": 1,
                  "frequency_steps": 4
                },
                "storagemanager": "dysco"
              },
              "specifications_template": "preprocessing schema"
            },
            "Pipeline 2": {
              "tags": [],
              "description": "Preprocessing Pipeline for Calibrator Observation 2",
              "specifications_doc": {
                "flag": {
                  "rfi_strategy": "auto",
                  "outerchannels": true,
                  "autocorrelations": true
                },
                "demix": {
                  "sources": {},
                  "time_steps": 10,
                  "ignore_target": false,
                  "frequency_steps": 64
                },
                "average": {
                  "time_steps": 1,
                  "frequency_steps": 4
                },
                "storagemanager": "dysco"
              },
              "specifications_template": "preprocessing schema"
            },
            "Pipeline SAP0": {
              "tags": [],
              "description": "Preprocessing Pipeline for Target Observation SAP0",
              "specifications_doc": {
                "flag": {
                  "rfi_strategy": "auto",
                  "outerchannels": true,
                  "autocorrelations": true
                },
                "demix": {
                  "sources": {},
                  "time_steps": 10,
                  "ignore_target": false,
                  "frequency_steps": 64
                },
                "average": {
                  "time_steps": 1,
                  "frequency_steps": 4
                },
                "storagemanager": "dysco"
              },
              "specifications_template": "preprocessing schema"
            },
            "Pipeline SAP1": {
              "tags": [],
              "description": "Preprocessing Pipeline for Target Observation SAP1",
              "specifications_doc": {
                "flag": {
                  "rfi_strategy": "auto",
                  "outerchannels": true,
                  "autocorrelations": true
                },
                "demix": {
                  "sources": {},
                  "time_steps": 10,
                  "ignore_target": false,
                  "frequency_steps": 64
                },
                "average": {
                  "time_steps": 1,
                  "frequency_steps": 4
                },
                "storagemanager": "dysco"
              },
              "specifications_template": "preprocessing schema"
            },
            "Target Observation": {
              "tags": [],
              "description": "Target Observation for UC1 HBA scheduling unit",
              "specifications_doc": {
                "QA": {
                  "plots": {
                    "enabled": true,
                    "autocorrelation": true,
                    "crosscorrelation": true
                  },
                  "file_conversion": {
                    "enabled": true,
                    "nr_of_subbands": -1,
                    "nr_of_timestamps": 256
                  }
                },
                "SAPs": [
                  {
                    "name": "target0",
                    "subbands": [
                      349,
                      372
                    ],
                    "digital_pointing": {
                      "angle1": 3.9935314947195253,
                      "angle2": 0.5324708659626034,
                      "angle3": 24,
                      "direction_type": "J2000"
                    }
                  },
                  {
                    "name": "target1",
                    "subbands": [
                      349,
                      372
                    ],
                    "digital_pointing": {
                      "angle1": 3.9935314947195253,
                      "angle2": 0.5324708659626034,
                      "angle3": 24,
                      "direction_type": "J2000"
                    }
                  }
                ],
                "filter": "HBA_110_190",
                "duration": 28800,
                "stations": [
                  {
                    "group": "ALL",
                    "min_stations": 1
                  }
                ],
                "tile_beam": {
                  "angle1": 5.324708659626033,
                  "angle2": 0.7099611546168045,
                  "angle3": 42,
                  "direction_type": "J2000"
                },
                "correlator": {
                  "storage_cluster": "CEP4",
                  "integration_time": 1,
                  "channels_per_subband": 64
                },
                "antenna_set": "HBA_DUAL_INNER"
              },
              "specifications_template": "observation schema"
            },
            "Calibrator Observation 1": {
              "tags": [],
              "description": "Calibrator Observation for UC1 HBA scheduling unit",
              "specifications_doc": {
                "duration": 600,
                "pointing": {
                  "angle1": 0,
                  "angle2": 0,
                  "angle3": 0,
                  "direction_type": "J2000"
                },
                "autoselect": false
              },
              "specifications_template": "calibrator schema"
            },
            "Calibrator Observation 2": {
              "tags": [],
              "description": "Calibrator Observation for UC1 HBA scheduling unit",
              "specifications_doc": {
                "duration": 600,
                "pointing": {
                  "angle1": 0,
                  "angle2": 0,
                  "angle3": 0,
                  "direction_type": "J2000"
                },
                "autoselect": false
              },
              "specifications_template": "calibrator schema"
            }
          },
          "parameters": [
            {
              "name": "Target Pointing 0",
              "refs": [
                "#/tasks/Target Observation/specifications_doc/SAPs/0/digital_pointing"
              ]
            },
            {
              "name": "Target Pointing 1",
              "refs": [
                "#/tasks/Target Observation/specifications_doc/SAPs/1/digital_pointing"
              ]
            },
            {
              "name": "Tile Beam",
              "refs": [
                "#/tasks/Target Observation/specifications_doc/tile_beam"
              ]
            }
          ],
          "task_relations": [
            {
              "tags": [],
              "input": {
                "role": "input",
                "datatype": "visibilities"
              },
              "output": {
                "role": "correlator",
                "datatype": "visibilities"
              },
              "consumer": "Pipeline 1",
              "producer": "Calibrator Observation 1",
              "dataformat": "MeasurementSet",
              "selection_doc": {},
              "selection_template": "All"
            },
            {
              "tags": [],
              "input": {
                "role": "input",
                "datatype": "visibilities"
              },
              "output": {
                "role": "correlator",
                "datatype": "visibilities"
              },
              "consumer": "Pipeline 2",
              "producer": "Calibrator Observation 2",
              "dataformat": "MeasurementSet",
              "selection_doc": {},
              "selection_template": "All"
            },
            {
              "tags": [],
              "input": {
                "role": "input",
                "datatype": "visibilities"
              },
              "output": {
                "role": "correlator",
                "datatype": "visibilities"
              },
              "consumer": "Pipeline SAP0",
              "producer": "Target Observation",
              "dataformat": "MeasurementSet",
              "selection_doc": {
                "sap": [
                  0
                ]
              },
              "selection_template": "SAP"
            },
            {
              "tags": [],
              "input": {
                "role": "input",
                "datatype": "visibilities"
              },
              "output": {
                "role": "correlator",
                "datatype": "visibilities"
              },
              "consumer": "Pipeline SAP1",
              "producer": "Target Observation",
              "dataformat": "MeasurementSet",
              "selection_doc": {
                "sap": [
                  1
                ]
              },
              "selection_template": "SAP"
            }
          ],
          "task_scheduling_relations": [
            {
              "first": "Calibrator Observation 1",
              "second": "Target Observation",
              "placement": "before",
              "time_offset": 60
            },
            {
              "first": "Calibrator Observation 2",
              "second": "Target Observation",
              "placement": "after",
              "time_offset": 60
            }
          ]
        },
        "requirements_template": "http://192.168.99.100:8008/api/scheduling_unit_template/1",
        "requirements_template_id": 1,
        "scheduling_set": "http://192.168.99.100:8008/api/scheduling_set/1",
        "scheduling_set_id": 1,
        "scheduling_unit_blueprints": [
          "http://192.168.99.100:8008/api/scheduling_unit_blueprint/1"
        ],
        "scheduling_unit_blueprints_ids": [
          1
        ],
        "tags": [
          "TEST",
          "UC1"
        ],
        "task_drafts": [
          "http://192.168.99.100:8008/api/task_draft/5",
          "http://192.168.99.100:8008/api/task_draft/7",
          "http://192.168.99.100:8008/api/task_draft/6",
          "http://192.168.99.100:8008/api/task_draft/4",
          "http://192.168.99.100:8008/api/task_draft/3",
          "http://192.168.99.100:8008/api/task_draft/2",
          "http://192.168.99.100:8008/api/task_draft/1"
        ],
        "task_drafts_ids": [
          5,
          7,
          6,
          4,
          3,
          2,
          1
        ],
        "updated_at": "2020-08-25T13:28:42.119417"
      }
};

export default SUServiceMock;