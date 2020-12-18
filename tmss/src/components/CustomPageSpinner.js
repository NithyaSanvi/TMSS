import React, {Component} from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';

/**
 * Custom spinner component for the whole page.
 */
export class CustomPageSpinner extends Component {
    render() {
        return (
            <>
            {this.props.visible &&
                <div style={{position: 'fixed', left:0, top: 0, width:'100%', height:'100%', backgroundColor: 'grey', zIndex: 9999, opacity: '0.5'}}>
                    <span style={{position: 'absolute', top: '50%', left:'50%', '-ms-transform': 'translateY(-50%)', transform: 'translateY(-50%)', backgroundColor:'white' }}>
                    <ProgressSpinner /></span>
                </div>
            }
            </>
        );
    }
}