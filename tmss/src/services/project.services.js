import _ from 'lodash';


const axios = require('axios');


// axios.defaults.baseURL = 'http://localhost:3000/api';

const ProjectServices = {

    getFileSystem: async function(){
        try {
          const url = `/filesystem/`;
          const response = await axios.get(url);
          return [
            {
                  "id": 1,
                  "url": "http://localhost:3000/api/filesystem/1",
                  "capacity": 3600000000000000,
                  "cluster": "http://localhost:3000/api/cluster/1",
                  "cluster_id": 1,
                  "created_at": "2020-08-26T08:40:24.880194",
                  "description": "",
                  "name": "LustreFS",
                  "tags": [],
                  "updated_at": "2020-08-26T08:40:24.880239"
                },
                {
                  "id": 2,
                  "url": "http://localhost:3000/api/filesystem/2",
                  "capacity": 360000000000000,
                  "cluster": "http://localhost:3000/api/cluster/1",
                  "cluster_id": 1,
                  "created_at": "2020-08-26T13:06:20.442543",
                  "description": "new storage",
                  "name": "Lofar Storage (SARA)",
                  "tags": [],
                  "updated_at": "2020-08-26T13:06:20.442591"
                },
                {
                  "id": 3,
                  "url": "http://localhost:3000/api/filesystem/3",
                  "capacity": 360000000000000,
                  "cluster": "http://localhost:3000/api/cluster/1",
                  "cluster_id": 1,
                  "created_at": "2020-08-26T13:06:21.060517",
                  "description": "new storage",
                  "name": "Lofar Test Storage (SARA)",
                  "tags": [],
                  "updated_at": "2020-08-26T13:06:21.060545"
                },
                {
                  "id": 4,
                  "url": "http://localhost:3000/api/filesystem/4",
                  "capacity": 360000000000000,
                  "cluster": "http://localhost:3000/api/cluster/1",
                  "cluster_id": 1,
                  "created_at": "2020-08-26T13:06:22.776714",
                  "description": "new storage",
                  "name": "Sara",
                  "tags": [],
                  "updated_at": "2020-08-26T13:06:22.776760"
                },
                {
                  "id": 5,
                  "url": "http://localhost:3000/api/filesystem/5",
                  "capacity": 360000000000000,
                  "cluster": "http://localhost:3000/api/cluster/1",
                  "cluster_id": 1,
                  "created_at": "2020-08-26T13:12:22.651907",
                  "description": "new storage",
                  "name": "Lofar Storage (Jülich)",
                  "tags": [],
                  "updated_at": "2020-08-26T13:12:22.651953"
                },
                {
                  "id": 6,
                  "url": "http://localhost:3000/api/filesystem/6",
                  "capacity": 360000000000000,
                  "cluster": "http://localhost:3000/api/cluster/1",
                  "cluster_id": 1,
                  "created_at": "2020-08-26T13:12:24.505652",
                  "description": "new storage",
                  "name": "Lofar User Disk Storage (SARA)",
                  "tags": [],
                  "updated_at": "2020-08-26T13:12:24.505701"
                },
                {
                  "id": 7,
                  "url": "http://localhost:3000/api/filesystem/6",
                  "capacity": 360000000000000,
                  "cluster": "http://localhost:3000/api/cluster/3",
                  "cluster_id": 3,
                  "created_at": "2020-08-26T13:12:24.505652",
                  "description": "new storage",
                  "name": "Lofar Storage (Poznan)",
                  "tags": [],
                  "updated_at": "2020-08-26T13:12:24.505701"
                },
                {
                  "id": 8,
                  "url": "http://localhost:3000/api/filesystem/6",
                  "capacity": 360000000000000,
                  "cluster": "http://localhost:3000/api/cluster/3",
                  "cluster_id": 3,
                  "created_at": "2020-08-26T13:12:24.505652",
                  "description": "new storage",
                  "name": "Lofar (Poznan)",
                  "tags": [],
                  "updated_at": "2020-08-26T13:12:24.505701"
                }
              ];
        } catch (error) {
          console.error(error);
        } 
        },
      getCluster:async function(){
       try {
          const url = `/cluster/`;
          const response = await axios.get(url);
         // return response.data.results;
          return [{
            "id": 1,
            "url": "http://localhost:3000/api/cluster/1",
            "created_at": "2020-08-26T08:40:24.876529",
            "description": "",
            "location": "CIT",
            "name": "CEP4",
            "tags": [],
            "archieve_site":false,
            "updated_at": "2020-08-26T08:40:24.876560"
          },
          {
            "id": 2,
            "url": "http://localhost:3000/api/cluster/2",
            "created_at": "2020-08-26T08:40:24.876529",
            "description": "",
            "location": "CSK",
            "name": "CEP4",
            "tags": [],
            "archieve_site":false,
            "updated_at": "2020-08-26T08:40:24.876560"
          },
          {
            "id": 3,
            "url": "http://localhost:3000/api/cluster/3",
            "created_at": "2020-08-26T08:40:24.876529",
            "description": "",
            "location": "CSK",
            "name": "ABC",
            "tags": [],
            "archive_site":true,
            "updated_at": "2020-08-26T08:40:24.876560"
          }

        ]
        } catch (error) {
          console.error(error);
        } 
      },
}
export default ProjectServices;