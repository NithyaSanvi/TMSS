import React, { Component } from 'react';
import { Button } from 'primereact/button';

class ProcessingDone extends Component {

    constructor(props) {
        super(props);
        this.Next = this.Next.bind(this);
    }

     /**
     * Method will trigger on click save buton
     * here onNext props coming from parent, where will handle redirection to other page
     */
    Next(){
        this.props.onNext({});
    }

    render(){
            return(
                    <>
                        <div className="p-grid p-justify-start">
                        <div className="p-col-1">
                            <Button label="Next" className="p-button-primary" icon="pi pi-check"  onClick={ this.Next }/>
                        </div>
                        <div className="p-col-1">
                            <Button label="Cancel" className="p-button-danger" icon="pi pi-times"  style={{ width : '90px' }} />
                        </div>
                        </div>
                
                    </>
            )
   };
    

}
export default ProcessingDone