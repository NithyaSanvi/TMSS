import React, {Component} from 'react';
import _ from 'lodash';
import TaskService from '../../services/task.service';
import ViewTable from '../../components/ViewTable';
import AppLoader from '../../layout/components/AppLoader';

/**
 * Component that list down the status change logs of subtasks
 */
export class TaskStatusLogs extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            logs: []
        }
    }

    async componentDidMount() {
        let logs = await TaskService.getTaskStatusLogs(this.props.taskId);
        logs = _.sortBy(logs, ['subtask_id', 'updated_at']);
        this.setState({logs: logs, isLoading: false});
    }

    render() {
        return(
            <React.Fragment>
            { this.state.isLoading? <AppLoader /> : 
                <ViewTable 
                    data={this.state.logs} 
                    defaultcolumns={[{subtask_id: "Subtask Id", subtask_type: "Type", updated_at: "Updated At", 
                                        old_state_value: "From State", new_state_value: "To State", user: 'User'}]} 
                    optionalcolumns={[{}]}
                    columnclassname={[{"Subtask Id": "filter-input-75", "Type": "filter-input-75",
                                        "Updated At": "filter-input-75", "From State": "filter-input-75",
                                        "To State": "filter-input-75", "User": "filter-input-75"}]}
                    defaultSortColumn={[{}]}
                    showaction="false"
                    keyaccessor="id"
                    paths={this.state.paths}
                    defaultpagesize={this.state.logs.length}
                    showTopTotal={false}
                    showGlobalFilter={false}
                    allowColumnSelection={false}
                />
            }
            </React.Fragment>
        );
    }
}

export default TaskStatusLogs;