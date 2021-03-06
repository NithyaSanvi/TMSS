import React, { useRef, useState } from "react";
import { useSortBy, useTable, useFilters, useGlobalFilter, useAsyncDebounce, usePagination, useRowSelect, useColumnOrder } from 'react-table'
import matchSorter from 'match-sorter'
import _ from 'lodash';
import moment from 'moment';
import { useHistory } from "react-router-dom";
import { OverlayPanel } from 'primereact/overlaypanel';
//import {InputSwitch} from 'primereact/inputswitch';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Paginator } from 'primereact/paginator';
import { TriStateCheckbox } from 'primereact/tristatecheckbox';
import { Slider } from 'primereact/slider';
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { InputNumber } from "primereact/inputnumber";
import { MultiSelect } from 'primereact/multiselect';
import { RadioButton } from 'primereact/radiobutton';
import { useExportData } from "react-table-plugins";
import UIConstants from '../utils/ui.constants';
import Papa from "papaparse";
import JsPDF from "jspdf";
import "jspdf-autotable";

let tbldata = [], filteredData = [];
let selectedRows = [];
let isunittest = false;
let showTopTotal = true;
let showGlobalFilter = true;
let showColumnFilter = true;
let allowColumnSelection = true;
let allowRowSelection = false;
let columnclassname = [];
let parentCallbackFunction, parentCBonSelection;
let showCSV = false;
let anyOfFilter = '';

// Define a default UI for filtering
function GlobalFilter({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}) {
  const [value, setValue] = React.useState(globalFilter)
  const onChange = useAsyncDebounce(value => { setGlobalFilter(value || undefined) }, 200)
  return (
    <span style={{ marginLeft: "-10px" }}>
      <input
        value={value || ""}
        onChange={e => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
      /> {" "}<i className="fa fa-search"></i>
    </span>
  )
}


// Define a default UI for filtering
function DefaultColumnFilter({
  column: { filterValue, preFilteredRows, setFilter, filteredRows },
}) {
  const [value, setValue] = useState('');
  React.useEffect(() => {
    if (!filterValue && value) {
      setValue('');
    }
  }, [filterValue, value]);
  return (
    <div className="table-filter" onClick={e => { e.stopPropagation() }}>
      <input
        value={value}   //***TO REMOVE - INCOMING CHANGE WAS value={filterValue || ''}
        onChange={e => {
          setValue(e.target.value);
          setFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
        }}
      />
      {value && <i onClick={() => { setFilter(undefined); setValue('') }} className="table-reset fa fa-times" />}
    </div>
  )
}

/* 
Generate and download csv 
*/
function getExportFileBlob({ columns, data, fileType, fileName }) {
  if (fileType === "csv") {
    // CSV download
    const headerNames = columns.map((col) => col.exportValue);
    // remove actionpath column in csv export
    var index = headerNames.indexOf('actionpath');
    if (index > -1) {
      headerNames.splice(index, 1);
    }
    const csvString = Papa.unparse({ fields: headerNames, data });
    return new Blob([csvString], { type: "text/csv" });
  } //PDF download
  else if (fileType === "pdf") {
    const headerNames = columns.map((column) => column.exportValue);
    const doc = new JsPDF();
    var index = headerNames.indexOf('Action');
    if (index > -1) {
      headerNames.splice(index, 1);
    }
    doc.autoTable({
      head: [headerNames],
      body: data,
    });
    doc.save(`${fileName}.pdf`);
    return false;
  }
}

// This is a custom filter UI for selecting
// a unique option from a list
function SelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id },
}) {
  const [value, setValue] = useState('');
  React.useEffect(() => {
    if (!filterValue && value) {
      setValue('');
    }
  }, [filterValue, value]);
  const options = React.useMemo(() => {
    const options = new Set()
    preFilteredRows.forEach(row => {
      options.add(row.values[id])
    })
    return [...options.values()]
  }, [id, preFilteredRows])
  // Render a multi-select box
  return (
    <div onClick={e => { e.stopPropagation() }}>
      <select
        style={{
          height: '24.2014px',
          width: '60px',
          border: '1px solid lightgrey',
        }}
        value={value}
        onChange={e => {
          setValue(e.target.value);
          setFilter(e.target.value || undefined)
        }}
      >
        <option value="">All</option>
        {options.map((option, i) => (
          <option key={i} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

// Multi-Select Custom Filter and set unique options value
function MultiSelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id },
}) {
  const [value, setValue] = useState('');
  const [filtertype, setFiltertype] = useState('Any');
  // Set Any / All Filter type
  const setSelectTypeOption = (option) => {
    setFiltertype(option);
    anyOfFilter = option
    if (value !== '') {
      setFilter(value);
    }
  };

  React.useEffect(() => {
    if (!filterValue && value) {
      setValue('');
      setFiltertype('Any');
    }
  }, [filterValue, value, filtertype]);
  anyOfFilter = filtertype;
  const options = React.useMemo(() => {
    let options = new Set();
    preFilteredRows.forEach(row => {
      row.values[id].split(',').forEach(value => {
        if (value !== '') {
          let hasValue = false;
          options.forEach(option => {
            if (option.name === value) {
              hasValue = true;
            }
          });
          if (!hasValue) {
            let option = { 'name': value, 'value': value };
            options.add(option);
          }
        }
      });
    });
    return [...options.values()]
  }, [id, preFilteredRows]);

  // Render a multi-select box
  return (
    <div onClick={e => { e.stopPropagation() }} >
      <div className="p-field-radiobutton">
        <RadioButton inputId="filtertype1" name="filtertype" value="Any" onChange={(e) => setSelectTypeOption(e.value)} checked={filtertype === 'Any'} />
        <label htmlFor="filtertype1">Any</label>
      </div>
      <div className="p-field-radiobutton">
        <RadioButton inputId="filtertype2" name="filtertype" value="All" onChange={(e) => setSelectTypeOption(e.value)} checked={filtertype === 'All'} />
        <label htmlFor="filtertype2">All</label>
      </div>
      <div style={{ position: 'relative' }} >
        <MultiSelect data-testid="multi-select" id="multi-select" optionLabel="value" optionValue="value" filter={true}
          value={value}
          options={options}
          onChange={e => {
            setValue(e.target.value);
            setFilter(e.target.value || undefined, filtertype)
          }}
          className="multi-select"
        />
      </div>
    </div>
  )
}

// This is a custom filter UI that uses a
// slider to set the filter value between a column's
// min and max values
function SliderColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id },
}) {
  // Calculate the min and max
  // using the preFilteredRows
  const [value, setValue] = useState(0);
  /*const [min, max] = React.useMemo(() => {
    let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    preFilteredRows.forEach(row => {
      min = Math.min(row.values[id], min)
      max = Math.max(row.values[id], max)
    })
    return [min, max]
  }, [id, preFilteredRows])*/

  return (
    <div onClick={e => { e.stopPropagation() }} className="table-slider">
      <Slider value={value} onChange={(e) => { setFilter(e.value); setValue(e.value) }} />
    </div>
  )
}

// This is a custom filter UI that uses a
// switch to set the value
function BooleanColumnFilter({
  column: { setFilter, filterValue },
}) {
  // Calculate the min and max
  // using the preFilteredRows
  const [value, setValue] = useState(null);
  React.useEffect(() => {
    if (!filterValue && value) {
      setValue(null);
    }
  }, [filterValue, value]);
  return (
    <div onClick={e => { e.stopPropagation() }}>
      <TriStateCheckbox value={value} style={{ 'width': '15px', 'height': '24.2014px' }} onChange={(e) => { setValue(e.value); setFilter(e.value === null ? undefined : e.value); }} />
    </div>
  )
}

// This is a custom filter UI that uses a
// calendar to set the value
function CalendarColumnFilter({
  column: { setFilter, filterValue },
}) {
  // Calculate the min and max
  // using the preFilteredRows
  const [value, setValue] = useState('');
  React.useEffect(() => {
    if (!filterValue && value) {
      setValue(null);
    }
  }, [filterValue, value]);
  return (

    <div className="table-filter" onClick={e => { e.stopPropagation() }}>
      <Calendar value={filterValue} appendTo={document.body} dateFormat="yy-mm-dd" onChange={(e) => {
        const value = moment(e.value).format('YYYY-MM-DD')
        setValue(value); 
        setFilter(e.value);
      }} showIcon></Calendar>
      {value && <i onClick={() => { setFilter(undefined); setValue('') }} className="tb-cal-reset fa fa-times" />}
    </div>
  )
}

// This is a custom filter UI that uses a
// calendar to set the value
function DateTimeColumnFilter({
  column: { setFilter, filterValue },
}) {
  const [value, setValue] = useState('');
  React.useEffect(() => {
    if (!filterValue && value) {
      setValue(null);
    }
  }, [filterValue, value]);
  return (

    <div className="table-filter" onClick={e => { e.stopPropagation() }}>
      <Calendar value={value} appendTo={document.body} dateFormat="yy/mm/dd" onChange={(e) => {
        const value = moment(e.value, moment.ISO_8601).format('YYYY-MM-DD HH:mm:ss')
        setValue(value); setFilter(value);
      }} showIcon
      // showTime= {true}
      //showSeconds= {true}
      // hourFormat= "24"
      ></Calendar>
      {value && <i onClick={() => { setFilter(undefined); setValue('') }} className="tb-cal-reset fa fa-times" />}
    </div>
  )
}

/**
 * Custom function to filter data from date field.
 * @param {Array} rows 
 * @param {String} id 
 * @param {String} filterValue 
 */
function fromDatetimeFilterFn(rows, id, filterValue) {
  const filteredRows = _.filter(rows, function (row) {
    // If cell value is null or empty
    if (!row.values[id]) {
      return false;
    }
    //Remove microsecond if value passed is UTC string in format "YYYY-MM-DDTHH:mm:ss.sssss"
    let rowValue = moment.utc(row.values[id].split('.')[0]);
    if (!rowValue.isValid()) {
      // For cell data in format 'YYYY-MMM-DD'
      rowValue = moment.utc(moment(row.values[id], 'YYYY-MM-DDTHH:mm:SS').format("YYYY-MM-DDTHH:mm:SS"));
    }
    const start = moment.utc(moment(filterValue, 'YYYY-MM-DDTHH:mm:SS').format("YYYY-MM-DDTHH:mm:SS"));

    return (start.isSameOrBefore(rowValue));
  });
  return filteredRows;
}

/**
 * Custom function to filter Multi selection based on filter type (Any/All) .
 * @param {Array} rows 
 * @param {String} id 
 * @param {String} filterValue 
 */
function multiSelectFilterFn(rows, id, filterValue) {
  if (filterValue) {
    const filteredRows = _.filter(rows, function (row) {
      if (filterValue.length === 0) {
        return true;
      }
      // If cell value is null or empty
      if (!row.values[id]) {
        return false;
      }
      let rowValue = row.values[id];
      let hasData = false;
      if (anyOfFilter === 'Any') {
        hasData = false;
        filterValue.forEach(filter => {
          if (rowValue.includes(filter)) {
            hasData = true;
          }
        });
      }
      else {
        hasData = true;
        filterValue.forEach(filter => {
          if (!rowValue.includes(filter)) {
            hasData = false;
          }
        });
      }
      return hasData;
    });
    return filteredRows;
  }
}

/**
 * Custom function to filter data from date field.
 * @param {Array} rows 
 * @param {String} id 
 * @param {String} filterValue 
 */
function toDatetimeFilterFn(rows, id, filterValue) {
  let end = moment.utc(moment(filterValue, 'YYYY-MM-DDTHH:mm:SS').format("YYYY-MM-DDTHH:mm:SS"));
  end = moment(end, "DD-MM-YYYY").add(1, 'days');
  const filteredRows = _.filter(rows, function (row) {
    // If cell value is null or empty
    if (!row.values[id]) {
      return false;
    }
    //Remove microsecond if value passed is UTC string in format "YYYY-MM-DDTHH:mm:ss.sssss"
    let rowValue = moment.utc(row.values[id].split('.')[0]);
    if (!rowValue.isValid()) {
      // For cell data in format 'YYYY-MMM-DD'
      rowValue = moment.utc(moment(row.values[id], 'YYYY-MM-DDTHH:mm:SS').format("YYYY-MM-DDTHH:mm:SS"));
    }
    return (end.isSameOrAfter(rowValue));
  });
  return filteredRows;
}

/**
 * Custom function to filter data from date field.
 * @param {Array} rows 
 * @param {String} id 
 * @param {String} filterValue 
 */
function dateFilterFn(rows, id, filterValue) {
  const filteredRows = _.filter(rows, function (row) {
    // If cell value is null or empty
    if (!row.values[id]) {
      return false;
    }
    //Remove microsecond if value passed is UTC string in format "YYYY-MM-DDTHH:mm:ss.sssss"
    let rowValue = moment.utc(row.values[id].split('.')[0]);
    if (!rowValue.isValid()) {
      // For cell data in format 'YYYY-MMM-DD'
      rowValue = moment.utc(moment(row.values[id], 'YYYY-MM-DD').format("YYYY-MM-DDT00:00:00"));
    }
    const start = moment.utc(moment(filterValue, 'YYYY-MM-DD').format("YYYY-MM-DDT00:00:00"));
    const end = moment.utc(moment(filterValue, 'YYYY-MM-DD').format("YYYY-MM-DDT23:59:59"));
    return (start.isSameOrBefore(rowValue) && end.isSameOrAfter(rowValue));
  });
  return filteredRows;
}

// This is a custom UI for our 'between' or number range
// filter. It uses slider to filter between min and max values.
function RangeColumnFilter({
  column: { filterValue = [], preFilteredRows, setFilter, id },
}) {
  const [min, max] = React.useMemo(() => {
    let min = 0;
    let max = 0;
    if (preFilteredRows.length > 0 && preFilteredRows[0].values[id]) {
      min = preFilteredRows[0].values[id];
    }
    preFilteredRows.forEach(row => {
      min = Math.min(row.values[id] ? row.values[id] : 0, min);
      max = Math.max(row.values[id] ? row.values[id] : 0, max);
    });
    return [min, max];
  }, [id, preFilteredRows]);
  if (filterValue.length === 0) {
    filterValue = [min, max];
  }

  return (
    <>
      <div className="filter-slider-label">
        <span style={{ float: "left" }}>{filterValue[0]}</span>
        <span style={{ float: "right" }}>{min !== max ? filterValue[1] : ""}</span>
      </div>
      <Slider value={filterValue} min={min} max={max} className="filter-slider"
        style={{}}
        onChange={(e) => { setFilter(e.value); }} range />
    </>
  );
}

// This is a custom UI for our 'between' or number range
// filter. It uses two number boxes and filters rows to
// ones that have values between the two
function NumberRangeColumnFilter({
  column: { filterValue = [], preFilteredRows, setFilter, id },
}) {
  const [errorProps, setErrorProps] = useState({});
  const [maxErr, setMaxErr] = useState(false);
  const [min, max] = React.useMemo(() => {
    let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    preFilteredRows.forEach(row => {
      min = Math.min(row.values[id], min)
      max = Math.max(row.values[id], max)
    })
    return [min, max]
  }, [id, preFilteredRows])

  return (
    <div
      style={{
        //  display: 'flex',
        //  flexdirection:'column',
        alignItems: 'center'
      }}
    >
      <InputText
        value={filterValue[0]}
        type="number"
        onChange={e => {
          const val = e.target.value;
          setFilter((old = []) => [val ? parseFloat(val, 10) : undefined, old[1]]);
        }}
        placeholder={`Min (${min})`}
        style={{
          width: '55px',
          height: '25px'
          // marginRight: '0.5rem',
        }}
      />
      <InputText
        value={filterValue[1] || ''}
        type="number"
        {...errorProps}
        className={maxErr && 'field-error'}
        onChange={e => {
          const val = e.target.value;
          const minVal = filterValue.length && filterValue[0];
          if (minVal && e.target.value < minVal) {
            setMaxErr(true);
            setErrorProps({
              tooltip: "Max value should be greater than Min",
              tooltipOptions: { event: 'hover' }
            });
          } else {
            setMaxErr(false);
            setErrorProps({});
          }
          setFilter((old = []) => [old[0], val ? parseFloat(val, 10) : undefined])
        }}
        placeholder={`Max (${max})`}
        style={{
          width: '55px',
          height: '25px'
          //  marginLeft: '0.5rem',
        }}
      />
    </div>
  )
}


function fuzzyTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, { keys: [row => row.values[id]] })
}

const filterTypes = {
  'select': {
    fn: SelectColumnFilter,
  },
  'multiselect': {
    fn: MultiSelectColumnFilter,
    type: multiSelectFilterFn
  },
  'switch': {
    fn: BooleanColumnFilter
  },
  'slider': {
    fn: SliderColumnFilter
  },
  'date': {
    fn: CalendarColumnFilter,
    type: dateFilterFn
  },
  'fromdatetime': {
    fn: DateTimeColumnFilter,
    type: fromDatetimeFilterFn
  },
  'todatetime': {
    fn: DateTimeColumnFilter,
    type: toDatetimeFilterFn
  },
  'range': {
    fn: RangeColumnFilter,
    type: 'between'
  },
  'minMax': {
    fn: NumberRangeColumnFilter,
    type: 'between'
  }
};
// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = val => !val

const IndeterminateCheckbox = React.forwardRef(
  ({ indeterminate, ...rest }, ref) => {
    const defaultRef = React.useRef()
    const resolvedRef = ref || defaultRef
    React.useEffect(() => {
      resolvedRef.current.indeterminate = indeterminate
    }, [resolvedRef, indeterminate])
    return <input type="checkbox" ref={resolvedRef} {...rest} />
  }
)

// Our table component
function Table({ columns, data, defaultheader, optionalheader, tablename, defaultSortColumn, defaultpagesize, columnOrders, showAction,toggleBySorting }) {

  const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      fuzzyText: fuzzyTextFilterFn,
      // Or, override the default text filter to use
      // "startWith"
      text: (rows, id, filterValue) => {
        return rows.filter(row => {
          const rowValue = row.values[id]
          return rowValue !== undefined
            ? String(rowValue)
              .toLowerCase()
              .startsWith(String(filterValue).toLowerCase())
            : true
        })
      },
    }),
    []
  )

  const defaultColumn = React.useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter,

    }),
    []
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setAllFilters,
    allColumns,
    getToggleHideAllColumnsProps,
    visibleColumns,
    state,
    page,
    preGlobalFilteredRows,
    setGlobalFilter,
    setHiddenColumns,
    gotoPage,
    setPageSize,
    selectedFlatRows,
    setColumnOrder,
    exportData,
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      filterTypes,
      initialState: {
        pageIndex: 0,
        pageSize: (defaultpagesize && defaultpagesize > 0) ? defaultpagesize : 10,
        sortBy: defaultSortColumn
      },
      getExportFileBlob,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect,
    useColumnOrder,
    useExportData
  );
  React.useEffect(() => {
    setHiddenColumns(
    //  columns.filter(column => !column.isVisible).map(column => column.accessor)
    columns.filter(column => !column.isVisible).map(column => column.id)
    );
    // console.log('columns List', visibleColumns.map((d) => d.id));
    if (columnOrders && columnOrders.length) {
      if (showAction === 'true') {
        setColumnOrder(['Select', 'Action', ...columnOrders]);
      } else {
        setColumnOrder(['Select', ...columnOrders]);
      }
    }
    
  }, [setHiddenColumns, columns]);

  let op = useRef(null);

  const [currentpage, setcurrentPage] = React.useState(0);
  const [currentrows, setcurrentRows] = React.useState(defaultpagesize);
  const [custompagevalue, setcustompagevalue] = React.useState();

  const onPagination = (e) => {
    gotoPage(e.page);
    setcurrentPage(e.first);
    setcurrentRows(e.rows);
    setPageSize(e.rows)
    if ([10, 25, 50, 100].includes(e.rows)) {
      setcustompagevalue();
    }
  };
  const onCustomPage = (e) => {
    if (typeof custompagevalue === 'undefined' || custompagevalue == null) return;
    gotoPage(0);
    setcurrentPage(0);
    setcurrentRows(custompagevalue);
    setPageSize(custompagevalue)
  };

  const onChangeCustompagevalue = (e) => {
    setcustompagevalue(e.target.value);
  }

  const onShowAllPage = (e) => {
    gotoPage(e.page);
    setcurrentPage(e.first);
    setcurrentRows(e.rows);
    setPageSize(tbldata.length)
    setcustompagevalue();
  };

  const onToggleChange = (e) => {
    let lsToggleColumns = [];
    allColumns.forEach(acolumn => {
      let jsonobj = {};
      let visible = (acolumn.Header === e.target.id) ? ((acolumn.isVisible) ? false : true) : acolumn.isVisible
      jsonobj['Header'] = acolumn.Header;
      jsonobj['isVisible'] = visible;
      lsToggleColumns.push(jsonobj)
    })
    localStorage.setItem(tablename, JSON.stringify(lsToggleColumns))
  }

  filteredData = _.map(rows, 'values');
  if (parentCallbackFunction) {
    parentCallbackFunction(filteredData);
  }

  /* Select only rows than can be selected. This is required when ALL is selected */
  selectedRows = _.filter(selectedFlatRows, selectedRow => { return (selectedRow.original.canSelect === undefined || selectedRow.original.canSelect) });
  /* Take only the original values passed to the component */
  selectedRows = _.map(selectedRows, 'original');
  /* Callback the parent function if available to pass the selected records on selection */
  if (parentCBonSelection) {
    parentCBonSelection(selectedRows)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div id="block_container" >
          {allowColumnSelection &&
            <div style={{ textAlign: 'left', marginRight: '30px' }}>
              <i className="fa fa-columns col-filter-btn" label="Toggle Columns" onClick={(e) => op.current.toggle(e)} />
              {showColumnFilter &&
                <div style={{ position: "relative", top: "-25px", marginLeft: "50px", color: "#005b9f" }} onClick={() => setAllFilters([])} >
                  <i class="fas fa-sync-alt" title="Clear All Filters"></i></div>}
              <OverlayPanel ref={op} id="overlay_panel" showCloseIcon={false} >
                <div>
                  <div style={{ textAlign: 'center' }}>
                    <label>Select column(s) to view</label>
                  </div>
                  <div style={{ float: 'left', backgroundColor: '#d1cdd936', width: '250px', height: '400px', overflow: 'auto', marginBottom: '10px', padding: '5px' }}>
                    <div id="tagleid"  >
                      <div >
                        <div style={{ marginBottom: '5px' }}>
                          <IndeterminateCheckbox {...getToggleHideAllColumnsProps()} /> Select All
                            </div>
                        {allColumns.map(column => (
                          <div key={column.id} style={{ 'display': column.id !== 'actionpath' ? 'block' : 'none' }}>
                            <input type="checkbox" {...column.getToggleHiddenProps()}
                              id={(defaultheader[column.id]) ? defaultheader[column.id] : (optionalheader[column.id] ? optionalheader[column.id] : column.id)}
                              onClick={(e)=>onToggleChange(e)}
                            /> {
                              (defaultheader[column.id]) ? defaultheader[column.id] : (optionalheader[column.id] ? optionalheader[column.id] : column.id)}
                          </div>
                        ))}
                        <br />
                      </div>
                    </div>
                  </div>
                </div>
              </OverlayPanel>
            </div>
          }
          <div style={{ textAlign: 'right' }}>
            {tbldata.length > 0 && !isunittest && showGlobalFilter &&
              <GlobalFilter
                preGlobalFilteredRows={preGlobalFilteredRows}
                globalFilter={state.globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
            }
          </div>


          {showTopTotal && filteredData.length === data.length &&
            <div className="total_records_top_label"> <label >Total records ({data.length})</label></div>
          }

          {showTopTotal && filteredData.length < data.length &&
            <div className="total_records_top_label" ><label >Filtered {filteredData.length} from {data.length}</label></div>}

        </div>
        {showCSV &&
          <div className="total_records_top_label" style={{ marginTop: '3px', marginRight: '5px' }} >
            <a href="#" onClick={() => { exportData("csv", false); }} title="Download CSV" style={{ verticalAlign: 'middle' }}>
              <i class="fas fa-file-csv" style={{ color: 'green', fontSize: '20px' }} ></i>
            </a>
          </div>
          /* 
            <div className="total_records_top_label" >
              <a href="#"  onClick={() => {exportData("pdf", false);}} title="Download PDF" style={{verticalAlign: 'middle'}}>
                  <i class="fas fa-file-pdf" style={{color: 'red', fontSize: '20px'}}></i>
              </a>
            </div> */
        }
      </div>


      <div className="tmss-table table_container">
        <table {...getTableProps()} data-testid="viewtable" className="viewtable" >
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th onClick={() => toggleBySorting({'id':column.id,desc:(column.isSortedDesc!= undefined? !column.isSortedDesc:false)}) }>
                    <div {...column.getHeaderProps(column.getSortByToggleProps())} >
                      {column.Header !== 'actionpath' && column.render('Header')}
                      {column.Header !== 'Action' ?
                        column.isSorted ? (column.isSortedDesc ? <i className="pi pi-sort-down" aria-hidden="true"></i> : <i className="pi pi-sort-up" aria-hidden="true"></i>) : ""
                        : ""
                      }
                    </div>

                    {/* Render the columns filter UI */}
                    {column.Header !== 'actionpath' &&
                      <div className={columnclassname[0][column.Header]}  >
                        {column.canFilter && column.Header !== 'Action' ? column.render('Filter') : null}

                      </div>
                    }
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row, i) => {
              prepareRow(row)
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => {
                    if (cell.column.id !== 'actionpath') {
                      return <td {...cell.getCellProps()}>
                        {(cell.row.original.links || []).includes(cell.column.id) ? <Link to={cell.row.original.linksURL[cell.column.id]}>{cell.render('Cell')}</Link> : cell.render('Cell')}
                      </td>
                    }
                    else {
                      return "";
                    }
                  }
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pagination p-grid" >
        {filteredData.length === data.length &&
          <div className="total_records_bottom_label" ><label >Total records ({data.length})</label></div>
        }
        {filteredData.length < data.length &&
          <div className="total_records_bottom_label" ><label >Filtered {filteredData.length} from {data.length}</label></div>
        }
        <div>
          <Paginator rowsPerPageOptions={[10, 25, 50, 100]} first={currentpage} rows={currentrows} totalRecords={rows.length} onPageChange={onPagination}></Paginator>
        </div>
        <div>
          <InputNumber id="custompage" value={custompagevalue} onChange={onChangeCustompagevalue}
            min={0} style={{ width: '100px' }} />
          <label >Records/Page</label>
          <Button onClick={onCustomPage}> Show </Button>
          <Button onClick={onShowAllPage} style={{ marginLeft: "1em" }}> Show All </Button>
        </div>
      </div>
    </>
  )
}


// Define a custom filter filter function!
function filterGreaterThan(rows, id, filterValue) {
  return rows.filter(row => {
    const rowValue = row.values[id]
    return rowValue >= filterValue
  })
}

// This is an autoRemove method on the filter function that
// when given the new filter value and returns true, the filter
// will be automatically removed. Normally this is just an undefined
// check, but here, we want to remove the filter if it's not a number
filterGreaterThan.autoRemove = val => typeof val !== 'number'

function ViewTable(props) {
  const history = useHistory();
  // Data to show in table
  tbldata = props.data;
  showCSV = (props.showCSV) ? props.showCSV : false;

  parentCallbackFunction = props.filterCallback;
  parentCBonSelection = props.onRowSelection;
  isunittest = props.unittest;
  columnclassname = props.columnclassname;
  showTopTotal = props.showTopTotal === undefined ? true : props.showTopTotal;
  showGlobalFilter = props.showGlobalFilter === undefined ? true : props.showGlobalFilter;
  showColumnFilter = props.showColumnFilter === undefined ? true : props.showColumnFilter;
  allowColumnSelection = props.allowColumnSelection === undefined ? true : props.allowColumnSelection;
  allowRowSelection = props.allowRowSelection === undefined ? false : props.allowRowSelection;
  // Default Header to show in table and other columns header will not show until user action on UI
  let defaultheader = props.defaultcolumns;
  let optionalheader = props.optionalcolumns;
  let defaultSortColumn = props.defaultSortColumn;
  let tablename = (props.tablename) ? props.tablename : window.location.pathname;

  if (!defaultSortColumn) {
    defaultSortColumn = [{}];
  }
  let defaultpagesize = (typeof props.defaultpagesize === 'undefined' || props.defaultpagesize == null) ? 10 : props.defaultpagesize;
  let columns = [];
  let defaultdataheader = Object.keys(defaultheader[0]);
  let optionaldataheader = Object.keys(optionalheader[0]);

  /* If allowRowSelection property is true for the component, add checkbox column as 1st column.
     If the record has property to select, enable the checkbox */
  if (allowRowSelection) {
    columns.push({
      Header: ({ getToggleAllRowsSelectedProps }) => {
        return (
          <div>
            <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} style={{ width: '15px', height: '15px' }} />
          </div>
        )
      },
      id: 'Select',
      accessor: props.keyaccessor,
      Cell: ({ row }) => {
        return (
          <div>
            {(row.original.canSelect === undefined || row.original.canSelect) &&
              <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} style={{ width: '15px', height: '15px' }} />
            }
            {row.original.canSelect === false &&
              <input type="checkbox" checked={false} disabled style={{ width: '15px', height: '15px' }}></input>
            }
          </div>
        )
      },
      disableFilters: true,
      disableSortBy: true,
      isVisible: true,
    });
  }

  if (props.showaction === 'true') {
    columns.push({
      Header: 'Action',
      id: 'Action',
      accessor: props.keyaccessor,
      Cell: props => <button className='p-link' onClick={navigateTo(props)} ><i className="fa fa-eye" style={{ cursor: 'pointer' }}></i></button>,
      disableFilters: true,
      disableSortBy: true,
      isVisible: defaultdataheader.includes(props.keyaccessor),
    })
  }

  const navigateTo = (cellProps) => () => {
    if (cellProps.cell.row.values['actionpath']) {
      if (!props.viewInNewWindow) {
        return history.push({
          pathname: cellProps.cell.row.values['actionpath'],
          state: {
            "id": cellProps.value,
          }
        })
      } else {
        window.open(cellProps.cell.row.values['actionpath'] , '_blank');
      }
    }
    // Object.entries(props.paths[0]).map(([key,value]) =>{})
  }

  //Default Columns
  defaultdataheader.forEach(header => {
    const isString = typeof defaultheader[0][header] === 'string';
    const filterFn = (showColumnFilter ? (isString ? DefaultColumnFilter : (filterTypes[defaultheader[0][header].filter] && filterTypes[defaultheader[0][header].filter].fn ? filterTypes[defaultheader[0][header].filter].fn : DefaultColumnFilter)) : "");
    const filtertype = (showColumnFilter ? (!isString && filterTypes[defaultheader[0][header].filter] && filterTypes[defaultheader[0][header].filter].type) ? filterTypes[defaultheader[0][header].filter].type : 'fuzzyText' : "");
    columns.push({
      Header: isString ? defaultheader[0][header] : defaultheader[0][header].name,
      id: isString ? defaultheader[0][header] : defaultheader[0][header].name,
      accessor: header,
      filter: filtertype,
      Filter: filterFn,
      //*** TO REMOVE - INCOMING CHANGE */
      // filter: (showColumnFilter?((!isString && defaultheader[0][header].filter=== 'date') ? 'includes' : 'fuzzyText'):""),
      // Filter: (showColumnFilter?(isString ? DefaultColumnFilter : (filterTypes[defaultheader[0][header].filter] ? filterTypes[defaultheader[0][header].filter] : DefaultColumnFilter)):""),
      isVisible: true,
      Cell: props => <div> {updatedCellvalue(header, props.value, defaultheader[0][header])} </div>,
    })
  })

  //Optional Columns
  optionaldataheader.forEach(header => {
    const isString = typeof optionalheader[0][header] === 'string';
    const filterFn = (showColumnFilter ? (isString ? DefaultColumnFilter : (filterTypes[optionalheader[0][header].filter] && filterTypes[optionalheader[0][header].filter].fn ? filterTypes[optionalheader[0][header].filter].fn : DefaultColumnFilter)) : "");
    const filtertype = (showColumnFilter ? (!isString && filterTypes[optionalheader[0][header].filter]) ? (filterTypes[optionalheader[0][header].filter].type || filterTypes[optionalheader[0][header].filter]) : 'fuzzyText' : "");
    columns.push({
      Header: isString ? optionalheader[0][header] : optionalheader[0][header].name,
      id: isString ? header : optionalheader[0][header].name,
      accessor: header,
      filter: filtertype,
      Filter: filterFn,
      isVisible: false,
      Cell: props => <div> {updatedCellvalue(header, props.value, optionalheader[0][header])} </div>,
    })
  });

  let togglecolumns = localStorage.getItem(tablename);
  if (togglecolumns) {
        togglecolumns = JSON.parse(togglecolumns);
        columns.forEach(column => {
            let tcolumn = _.find(togglecolumns, {Header: column.Header});
            column['isVisible'] = (tcolumn)? tcolumn.isVisible: column.isVisible;
        });
        /*columns.forEach(column => {
            togglecolumns.filter(tcol => {
            column.isVisible = (tcol.Header === column.Header) ? tcol.isVisible : column.isVisible;
            return tcol;
        });
      });*/
  }

  function updatedCellvalue(key, value, properties) {
    try {
      if (key === 'blueprint_draft' && _.includes(value, '/task_draft/')) {
        //  'task_draft/' -> len = 12
        var taskid = _.replace(value.substring((value.indexOf('/task_draft/') + 12), value.length), '/', '');
        return <a href={'/task/view/draft/' + taskid}>{' ' + taskid + ' '}</a>
      } else if (key === 'blueprint_draft') {
        var retval = [];
        value.forEach((link, index) => {
          //  'task_blueprint/' -> len = 16
          if (_.includes(link, '/task_blueprint/')) {
            var bpid = _.replace(link.substring((link.indexOf('/task_blueprint/') + 16), link.length), '/', '');
            retval.push(<a href={'/task/view/blueprint/' + bpid} key={bpid + index} >{'  ' + bpid + '  '}</a>)
          }
        })
        return retval;
      } else if (typeof value == "boolean") {
        return value.toString();
      }else if (typeof value == "string") {
        const format = properties ? properties.format : 'YYYY-MM-DD HH:mm:ss';
        const dateval = moment(value, moment.ISO_8601).format(format);
        if (dateval !== 'Invalid date') {
          return dateval;
        }
     }
    } catch (err) {
      console.error('Error', err)
    }
    return value;
  };

  return (
    <div>
      <Table columns={columns} data={tbldata} defaultheader={defaultheader[0]} optionalheader={optionalheader[0]} showAction={props.showaction}
        defaultSortColumn={defaultSortColumn} tablename={tablename} defaultpagesize={defaultpagesize} columnOrders={props.columnOrders} toggleBySorting={(sortData)=>props.toggleBySorting(sortData)}/>
    </div>
  )
}

export default ViewTable