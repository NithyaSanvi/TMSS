import Loader from 'react-loader-spinner';
import React, { Component } from 'react'

export class AppLoader extends Component{ 

    render() {
        const load = {
                width: "100%",
                height: "100",
                display: "flex",
               justifyContent: "center"
        }
        
        return (
            <div style={load}>
            <Loader type="ThreeDots" color="#004B93" height={80} width={80} />
            </div>
        );
    }
}
export default AppLoader