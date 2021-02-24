import React, {Component} from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

/**
 * Custom Dialog component to get user input before doing something. It can be warning information or confirmation or error message and based on the 
 * user's input will proceed to next step.
 */
export class CustomDialog extends Component {
    
    constructor(props) {
        super(props);
        this.state = {
            visible: props.visible===undefined?true:props.visible
        }
    }

    render() {
        const isConfirm = this.props.type.toLowerCase()==='confirmation';
        const isWarning = this.props.type.toLowerCase()==='warning';
        const isSuccess = this.props.type.toLowerCase()==='success';
        // const isError = this.props.type.toLowerCase()==='error';
        let iconClass = isConfirm?"pi-question-circle pi-warning":(isWarning?"pi-info-circle pi-warning": (isSuccess?"pi-check-circle pi-success":"pi-times-circle pi-danger"));
        return (
            <div className="p-grid" data-testid="confirm_dialog">
                    <Dialog header={this.props.header} visible={this.props.visible} style={{width: this.props.width?this.props.width:'25vw'}} 
                            inputId="confirm_dialog"
                            modal={true}  onHide={this.props.onClose} 
                            footer={<div>
                                {/* Action buttons based on 'type' props. If 'actions' passed as props, then type is ignored */}
                                {!this.props.actions && 
                                <>
                                    {isConfirm &&
                                        <Button key="back" onClick={this.props.onCancel} label="No" />
                                    }
                                    <Button key="submit" type="primary" onClick={this.props.onSubmit?this.props.onSubmit:this.props.onClose} label={isConfirm?'Yes':'Ok'} />
                                </>
                                }
                                {/* Action button based on the 'actions' props */}
                                {this.props.actions && this.props.actions.map((action, index) => {
                                    return (
                                    <Button key={action.id} label={action.title} onClick={action.callback} />);
                                })}
                                </div>
                            } >
                            <div className="p-grid">
                                <div className="col-lg-2 col-md-2 col-sm-2">
                                    <span style={{position: 'absolute', top: '50%', '-ms-transform': 'translateY(-50%)', transform: 'translateY(-50%)'}}>
                                        <i className={`pi pi-large ${iconClass}`}></i>
                                    </span>
                                </div>
                                <div className="col-lg-10 col-md-10 col-sm-10">
                                    {/* Display message passed */}
                                    {this.props.message?this.props.message:""}
                                    {/* Render subcomponent passed as function */}
                                    {this.props.content?this.props.content():""}
                                </div>
                            </div>
                    </Dialog>
                </div>
        );
    }
}