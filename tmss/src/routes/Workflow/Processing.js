import React, { Component } from 'react';
import { Button } from 'primereact/button';

class ProcessingDone extends Component{

    render(){
        return(
               <>
                  
                    <div className="p-grid p-justify-start">
                    <div className="p-col-1">
                        <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={this.onSave} />
                    </div>
                    <div className="p-col-1">
                        <Button label="Cancel" className="p-button-danger" icon="pi pi-times"  style={{ width : '90px' }} onClick={this.cancelCreate} />
                    </div>
                    </div>
            
               </>
        )
    };
    

}
export default ProcessingDone