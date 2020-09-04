const TaskServiceMock= {
    taskTemplates: [
        {
          "id": 1,
          "url": "http://192.168.99.100:8008/api/task_template/1",
          "created_at": "2020-08-25T13:28:33.979487",
          "description": "preprocessing settings",
          "name": "preprocessing schema",
          "schema": {
            "$id": "http://example.com/example.json",
            "type": "object",
            "$schema": "http://json-schema.org/draft-06/schema#",
            "required": [
              "storagemanager"
            ],
            "properties": {
              "flag": {
                "type": "object",
                "title": "Flagging",
                "default": {},
                "required": [
                  "outerchannels",
                  "autocorrelations",
                  "rfi_strategy"
                ],
                "properties": {
                  "rfi_strategy": {
                    "enum": [
                      "none",
                      "auto",
                      "HBAdefault",
                      "LBAdefault"
                    ],
                    "type": "string",
                    "title": "RFI flagging strategy",
                    "default": "auto"
                  },
                  "outerchannels": {
                    "type": "boolean",
                    "title": "Flag outer channels",
                    "default": true
                  },
                  "autocorrelations": {
                    "type": "boolean",
                    "title": "Flag auto correlations",
                    "default": true
                  }
                },
                "additionalProperties": false
              },
              "demix": {
                "type": "object",
                "title": "Demixing",
                "default": {},
                "options": {
                  "dependencies": {
                    "demix": true
                  }
                },
                "required": [
                  "frequency_steps",
                  "time_steps",
                  "ignore_target",
                  "sources"
                ],
                "properties": {
                  "sources": {
                    "type": "object",
                    "title": "Sources",
                    "default": {},
                    "properties": {
                      "CasA": {
                        "$ref": "#/definitions/demix_strategy",
                        "title": "CasA"
                      },
                      "CygA": {
                        "$ref": "#/definitions/demix_strategy",
                        "title": "CygA"
                      },
                      "HerA": {
                        "$ref": "#/definitions/demix_strategy",
                        "title": "HerA"
                      },
                      "TauA": {
                        "$ref": "#/definitions/demix_strategy",
                        "title": "TauA"
                      },
                      "VirA": {
                        "$ref": "#/definitions/demix_strategy",
                        "title": "VirA"
                      },
                      "HydraA": {
                        "$ref": "#/definitions/demix_strategy",
                        "title": "HyrdraA"
                      }
                    },
                    "additionalProperties": false
                  },
                  "time_steps": {
                    "type": "integer",
                    "title": "Time steps",
                    "default": 10,
                    "minimum": 1,
                    "description": "Must be a multiple of the averaging time steps"
                  },
                  "ignore_target": {
                    "type": "boolean",
                    "title": "Ignore target",
                    "default": false
                  },
                  "frequency_steps": {
                    "type": "integer",
                    "title": "Frequency steps",
                    "default": 64,
                    "minimum": 1,
                    "description": "Must be a multiple of the averaging frequency steps"
                  }
                },
                "additionalProperties": false
              },
              "average": {
                "type": "object",
                "title": "Averaging",
                "default": {},
                "required": [
                  "frequency_steps",
                  "time_steps"
                ],
                "properties": {
                  "time_steps": {
                    "type": "integer",
                    "title": "Time steps",
                    "default": 1,
                    "minimum": 1
                  },
                  "frequency_steps": {
                    "type": "integer",
                    "title": "Frequency steps",
                    "default": 4,
                    "minimum": 1
                  }
                },
                "additionalProperties": false
              },
              "storagemanager": {
                "enum": [
                  "basic",
                  "dysco"
                ],
                "type": "string",
                "title": "Storage Manager",
                "default": "dysco"
              }
            },
            "definitions": {
              "demix_strategy": {
                "enum": [
                  "auto",
                  "yes",
                  "no"
                ],
                "type": "string",
                "default": "auto"
              }
            },
            "additionalProperties": false
          },
          "tags": [],
          "type": "http://192.168.99.100:8008/api/task_type/pipeline",
          "type_value": "pipeline",
          "updated_at": "2020-08-25T13:28:33.979514",
          "validation_code_js": "",
          "version": "0.1"
        },
        {
          "id": 2,
          "url": "http://192.168.99.100:8008/api/task_template/2",
          "created_at": "2020-08-25T13:28:33.983945",
          "description": "schema for observations",
          "name": "observation schema",
          "schema": {
            "$id": "http://example.com/example.json",
            "type": "object",
            "$schema": "http://json-schema.org/draft-06/schema#",
            "required": [
              "stations",
              "antenna_set",
              "filter",
              "SAPs",
              "duration",
              "correlator"
            ],
            "properties": {
              "QA": {
                "type": "object",
                "title": "Quality Assurance",
                "default": {},
                "properties": {
                  "plots": {
                    "type": "object",
                    "title": "Plots",
                    "default": {},
                    "properties": {
                      "enabled": {
                        "type": "boolean",
                        "title": "enabled",
                        "default": true,
                        "description": "Do/Don't create plots from the QA file from the observation"
                      },
                      "autocorrelation": {
                        "type": "boolean",
                        "title": "autocorrelation",
                        "default": true,
                        "description": "Create autocorrelation plots for all stations"
                      },
                      "crosscorrelation": {
                        "type": "boolean",
                        "title": "crosscorrelation",
                        "default": true,
                        "description": "Create crosscorrelation plots for all baselines"
                      }
                    },
                    "description": "Create dynamic spectrum plots",
                    "additionalProperties": false
                  },
                  "file_conversion": {
                    "type": "object",
                    "title": "File Conversion",
                    "default": {},
                    "properties": {
                      "enabled": {
                        "type": "boolean",
                        "title": "enabled",
                        "default": true,
                        "description": "Do/Don't create a QA file for the observation"
                      },
                      "nr_of_subbands": {
                        "type": "integer",
                        "title": "#subbands",
                        "default": -1,
                        "description": "Keep this number of subbands from the observation in the QA file, or all if -1"
                      },
                      "nr_of_timestamps": {
                        "type": "integer",
                        "title": "#timestamps",
                        "default": 256,
                        "minimum": 1,
                        "description": "Extract this number of timestamps from the observation in the QA file (equidistantanly sampled, no averaging/interpolation)"
                      }
                    },
                    "description": "Create a QA file for the observation",
                    "additionalProperties": false
                  }
                },
                "description": "Specify Quality Assurance steps for this observation",
                "additionalProperties": false
              },
              "SAPs": {
                "type": "array",
                "items": {
                  "type": "object",
                  "title": "SAP",
                  "default": {},
                  "required": [
                    "digital_pointing",
                    "subbands"
                  ],
                  "properties": {
                    "name": {
                      "type": "string",
                      "title": "Name/target",
                      "default": "",
                      "description": "Identifier for this beam"
                    },
                    "subbands": {
                      "type": "array",
                      "items": {
                        "type": "integer",
                        "title": "Subband",
                        "maximum": 511,
                        "minimum": 0
                      },
                      "title": "Subband list",
                      "default": [],
                      "additionalItems": false
                    },
                    "digital_pointing": {
                      "$ref": "#/definitions/pointing",
                      "title": "Digital pointing",
                      "default": {}
                    }
                  },
                  "headerTemplate": "{{ i0 }} - {{ self.name }}",
                  "additionalProperties": false
                },
                "title": "SAPs",
                "default": [
                  {}
                ],
                "description": "Station beams",
                "additionalItems": false
              },
              "filter": {
                "enum": [
                  "LBA_10_70",
                  "LBA_30_70",
                  "LBA_10_90",
                  "LBA_30_90",
                  "HBA_110_190",
                  "HBA_210_250"
                ],
                "type": "string",
                "title": "Band-pass filter",
                "default": "HBA_110_190",
                "description": "Must match antenna type"
              },
              "duration": {
                "type": "number",
                "title": "Duration (seconds)",
                "default": 300,
                "minimum": 1,
                "description": "Duration of this observation"
              },
              "stations": {
                "oneOf": [
                  {
                    "type": "array",
                    "items": {
                      "enum": [
                        "CS001",
                        "CS002",
                        "CS003",
                        "CS004",
                        "CS005",
                        "CS006",
                        "CS007",
                        "CS011",
                        "CS013",
                        "CS017",
                        "CS021",
                        "CS024",
                        "CS026",
                        "CS028",
                        "CS030",
                        "CS031",
                        "CS032",
                        "CS101",
                        "CS103",
                        "CS201",
                        "CS301",
                        "CS302",
                        "CS401",
                        "CS501",
                        "RS104",
                        "RS106",
                        "RS205",
                        "RS208",
                        "RS210",
                        "RS305",
                        "RS306",
                        "RS307",
                        "RS310",
                        "RS406",
                        "RS407",
                        "RS409",
                        "RS410",
                        "RS503",
                        "RS508",
                        "RS509",
                        "DE601",
                        "DE602",
                        "DE603",
                        "DE604",
                        "DE605",
                        "FR606",
                        "SE607",
                        "UK608",
                        "DE609",
                        "PL610",
                        "PL611",
                        "PL612",
                        "IE613",
                        "LV614"
                      ],
                      "type": "string",
                      "title": "Station",
                      "description": ""
                    },
                    "title": "Fixed list",
                    "default": [
                      "CS001"
                    ],
                    "minItems": 1,
                    "uniqueItems": true,
                    "additionalItems": false,
                    "additionalProperties": false
                  },
                  {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "title": "Station set",
                      "required": [
                        "group",
                        "min_stations"
                      ],
                      "properties": {
                        "group": {
                          "enum": [
                            "ALL",
                            "SUPERTERP",
                            "CORE",
                            "REMOTE",
                            "DUTCH",
                            "INTERNATIONAL"
                          ],
                          "type": "string",
                          "title": "Group/station",
                          "default": "ALL",
                          "description": "Which (group of) station(s) to select from"
                        },
                        "min_stations": {
                          "type": "integer",
                          "title": "Minimum nr of stations",
                          "default": 1,
                          "minimum": 0,
                          "description": "Number of stations to use within group/station"
                        }
                      },
                      "headerTemplate": "{{ self.group }}",
                      "additionalProperties": false
                    },
                    "title": "Dynamic list",
                    "default": [
                      {}
                    ],
                    "additionalItems": false
                  }
                ],
                "title": "Station list",
                "default": [
                  "CS001"
                ]
              },
              "tile_beam": {
                "$ref": "#/definitions/pointing",
                "title": "Tile beam",
                "description": "HBA only"
              },
              "correlator": {
                "type": "object",
                "title": "Correlator Settings",
                "default": {},
                "required": [
                  "channels_per_subband",
                  "integration_time",
                  "storage_cluster"
                ],
                "properties": {
                  "storage_cluster": {
                    "enum": [
                      "CEP4",
                      "DragNet"
                    ],
                    "type": "string",
                    "title": "Storage cluster",
                    "default": "CEP4",
                    "description": "Cluster to write output to"
                  },
                  "integration_time": {
                    "type": "number",
                    "title": "Integration time (seconds)",
                    "default": 1,
                    "minimum": 0.1,
                    "description": "Desired integration period"
                  },
                  "channels_per_subband": {
                    "enum": [
                      8,
                      16,
                      32,
                      64,
                      128,
                      256,
                      512,
                      1024
                    ],
                    "type": "integer",
                    "title": "Channels/subband",
                    "default": 64,
                    "minimum": 8,
                    "description": "Number of frequency bands per subband"
                  }
                },
                "additionalProperties": false
              },
              "antenna_set": {
                "enum": [
                  "HBA_DUAL",
                  "HBA_DUAL_INNER",
                  "HBA_ONE",
                  "HBA_ONE_INNER",
                  "HBA_ZERO",
                  "HBA_ZERO_INNER",
                  "LBA_INNER",
                  "LBA_OUTER",
                  "LBA_SPARSE_EVEN",
                  "LBA_SPARSE_ODD",
                  "LBA_ALL"
                ],
                "type": "string",
                "title": "Antenna set",
                "default": "HBA_DUAL",
                "description": "Fields & antennas to use"
              }
            },
            "definitions": {
              "pointing": {
                "type": "object",
                "required": [
                  "angle1",
                  "angle2"
                ],
                "properties": {
                  "angle1": {
                    "type": "number",
                    "title": "Angle 1",
                    "default": 0,
                    "description": "First angle (e.g. RA)"
                  },
                  "angle2": {
                    "type": "number",
                    "title": "Angle 2",
                    "default": 0,
                    "description": "Second angle (e.g. DEC)"
                  },
                  "angle3": {
                    "type": "number",
                    "title": "Angle 3",
                    "default": 0,
                    "description": "Third angle (e.g. N in LMN)"
                  },
                  "direction_type": {
                    "enum": [
                      "J2000",
                      "AZELGEO",
                      "LMN",
                      "SUN",
                      "MOON",
                      "MERCURY",
                      "VENUS",
                      "MARS",
                      "JUPITER",
                      "SATURN",
                      "URANUS",
                      "NEPTUNE",
                      "PLUTO"
                    ],
                    "type": "string",
                    "title": "Reference frame",
                    "default": "J2000",
                    "description": ""
                  }
                },
                "additionalProperties": false
              }
            },
            "additionalProperties": false
          },
          "tags": [],
          "type": "http://192.168.99.100:8008/api/task_type/observation",
          "type_value": "observation",
          "updated_at": "2020-08-25T13:28:33.983964",
          "validation_code_js": "",
          "version": "0.1"
        },
        {
          "id": 3,
          "url": "http://192.168.99.100:8008/api/task_template/3",
          "created_at": "2020-08-25T13:28:33.988294",
          "description": "addon schema for calibrator observations",
          "name": "calibrator schema",
          "schema": {
            "$id": "http://example.com/example.json",
            "type": "object",
            "$schema": "http://json-schema.org/draft-06/schema#",
            "required": [
              "autoselect",
              "duration",
              "pointing"
            ],
            "properties": {
              "duration": {
                "type": "number",
                "title": "Duration (seconds)",
                "default": 600,
                "minimum": 1,
                "description": "Duration of this observation"
              },
              "pointing": {
                "$ref": "#/definitions/pointing",
                "title": "Digital pointing",
                "default": {},
                "description": "Manually selected calibrator"
              },
              "autoselect": {
                "type": "boolean",
                "title": "Auto-select",
                "default": true,
                "description": "Auto-select calibrator based on elevation"
              }
            },
            "definitions": {
              "pointing": {
                "type": "object",
                "required": [
                  "angle1",
                  "angle2"
                ],
                "properties": {
                  "angle1": {
                    "type": "number",
                    "title": "Angle 1",
                    "default": 0,
                    "description": "First angle [rad] (e.g. RA)"
                  },
                  "angle2": {
                    "type": "number",
                    "title": "Angle 2",
                    "default": 0,
                    "description": "Second angle [rad] (e.g. DEC)"
                  },
                  "angle3": {
                    "type": "number",
                    "title": "Angle 3",
                    "default": 0,
                    "description": "Third angle [rad] (e.g. N in LMN)"
                  },
                  "direction_type": {
                    "enum": [
                      "J2000",
                      "AZELGEO",
                      "LMN",
                      "SUN",
                      "MOON",
                      "MERCURY",
                      "VENUS",
                      "MARS",
                      "JUPITER",
                      "SATURN",
                      "URANUS",
                      "NEPTUNE",
                      "PLUTO"
                    ],
                    "type": "string",
                    "title": "Reference frame",
                    "default": "J2000",
                    "description": ""
                  }
                },
                "additionalProperties": false
              }
            },
            "additionalProperties": false
          },
          "tags": [],
          "type": "http://192.168.99.100:8008/api/task_type/observation",
          "type_value": "observation",
          "updated_at": "2020-08-25T13:28:33.988312",
          "validation_code_js": "",
          "version": "0.1"
        }
      ]
};

export default TaskServiceMock;