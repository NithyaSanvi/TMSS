import React, {Component} from 'react';

export class Dashboard extends Component {

    constructor(props){
        super(props)
        console.log(this.props)
    }
    render() {
        return (
            <h1>Dashboard</h1>
        );
    }
}

export default Dashboard;