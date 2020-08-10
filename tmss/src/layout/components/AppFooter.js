import React, { Component } from 'react';

export class AppFooter extends Component {

    render() {
        return  (
            <div className="layout-footer">
                <span className="footer-text" style={{'marginRight': '5px', color:'#0066CC'}}><strong>TMSS</strong> by <strong>ASTRON</strong></span>
            </div>
        );
    }
}

export default AppFooter;