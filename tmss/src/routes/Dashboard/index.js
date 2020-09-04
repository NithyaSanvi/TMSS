import React, {Component} from 'react';
import PageHeader from '../../layout/components/PageHeader';


export class Dashboard extends Component {

    render() {
       
        return (
            <PageHeader location={this.props.location} title={'Dashboard'} />
        )
    }
}

export default Dashboard;