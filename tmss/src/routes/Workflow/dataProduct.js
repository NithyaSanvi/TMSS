import React from 'react';

export default ({ data }) => {
    return (
        <div className="data-product">
            <label>Observation: {data.observation}</label>
            <label>Pipeline: {data.pipeline}</label>
            <label>Observation Deleted Since: {data.observation_deletedSince}</label>
            <label>Pipeline Deleted Since: {data.pipeline_deletedSince}</label>
        </div>
    )
}