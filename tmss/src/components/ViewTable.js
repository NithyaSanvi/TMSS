import React, {useRef, useState } from "react";
import { useSortBy, useTable, useFilters, useGlobalFilter, useAsyncDebounce, usePagination } from 'react-table'
import matchSorter from 'match-sorter'
import _ from 'lodash';
import moment from 'moment';
import { useHistory } from "react-router-dom";
import {OverlayPanel} from 'primereact/overlaypanel';
import {InputSwitch} from 'primereact/inputswitch';
import { Calendar } from 'primereact/calendar';
import {Paginator} from 'primereact/paginator';
import { Button } from "react-bootstrap";
import { InputNumber } from "primereact/inputnumber";

let tbldata =[], filteredData = [] ;
let isunittest = false;
let showTopTotal = true;
let showGlobalFilter = true;
let showColumnFilter = true;
let allowColumnSelection = true;
let columnclassname =[];
let parentCallbackFunction;

// Define a default UI for filtering
function GlobalFilter({
    preGlobalFilteredRows,
    globalFilter,
    setGlobalFilter,
  }) {
  const [value, setValue] = React.useState(globalFilter)
  const onChange = useAsyncDebounce(value => {setGlobalFilter(value || undefined)}, 200)
  return (
    <span>
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
  return (
    <input
      value={filterValue || ''}
      onChange={e => {
        setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
      }}
    />
  )
}


// This is a custom filter UI for selecting
// a unique option from a list
function SelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id },
}) {
  // Calculate the options for filtering
  // using the preFilteredRows
  const options = React.useMemo(() => {
    const options = new Set()
    preFilteredRows.forEach(row => {
      options.add(row.values[id])
    })
    return [...options.values()]
  }, [id, preFilteredRows])

  // Render a multi-select box
  return (
    <select
      value={filterValue}
      onChange={e => {
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
    <>
      <input
        type="range"
        min={min}
        max={max}
        value={filterValue || min}
        onChange={e => {
          setFilter(parseInt(e.target.value, 10))
        }}
      />
      <button onClick={() => setFilter(undefined)}>Off</button>
    </>
  )
}

// This is a custom filter UI that uses a
// switch to set the value
function BooleanColumnFilter({
  column: { setFilter},
}) {
  const [value, setValue] = useState(true);
  return (
    <>
      <InputSwitch checked={value} onChange={() => { setValue(!value); setFilter(!value); }} />
      <button onClick={() => setFilter(undefined)}>Off</button>
    </>
  )
}

// This is a custom filter UI that uses a
// calendar to set the value
function CalendarColumnFilter({
  column: { setFilter},
}) {
  const [value, setValue] = useState('');
  return (
    <>
      <Calendar value={value} onChange={(e) => {
        const value = moment(e.value, moment.ISO_8601).format("YYYY-MMM-DD")
          setValue(value); setFilter(value); 
        }} showIcon></Calendar>
      <button onClick={() => setFilter(undefined)}>Off</button>
    </>
  )
}


// This is a custom UI for our 'between' or number range
// filter. It uses two number boxes and filters rows to
// ones that have values between the two
function NumberRangeColumnFilter({
  column: { filterValue = [], preFilteredRows, setFilter, id },
}) {
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
        display: 'flex',
      }}
    >
      <input
        value={filterValue[0] || ''}
        type="number"
        onChange={e => {
          const val = e.target.value
          setFilter((old = []) => [val ? parseInt(val, 10) : undefined, old[1]])
        }}
        placeholder={`Min (${min})`}
        style={{
          width: '70px',
          marginRight: '0.5rem',
        }}
      />
      to
      <input
        value={filterValue[1] || ''}
        type="number"
        onChange={e => {
          const val = e.target.value
          setFilter((old = []) => [old[0], val ? parseInt(val, 10) : undefined])
        }}
        placeholder={`Max (${max})`}
        style={{
          width: '70px',
          marginLeft: '0.5rem',
        }}
      />
    </div>
  )
}


function fuzzyTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, { keys: [row => row.values[id]] })
}

const filterTypes = {
  'select': SelectColumnFilter,
  'switch': BooleanColumnFilter,
  'slider': SliderColumnFilter,
  'date': CalendarColumnFilter,
  'range': NumberRangeColumnFilter
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
function Table({ columns, data, defaultheader, optionalheader, defaultSortColumn, tablename, defaultpagesize }) {
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
    allColumns,
    getToggleHideAllColumnsProps,
    state,
    page,
    preGlobalFilteredRows,
    setGlobalFilter,
    setHiddenColumns,
    gotoPage,
    setPageSize,
  } = useTable(
      {
        columns,
        data,
        defaultColumn,
        filterTypes,
        initialState: { pageIndex: 0,
          pageSize: (defaultpagesize && defaultpagesize>0)?defaultpagesize:10,
          sortBy: defaultSortColumn }
      },
      useFilters,
      useGlobalFilter,
      useSortBy,   
      usePagination
    );
  React.useEffect(() => {
    setHiddenColumns(
      columns.filter(column => !column.isVisible).map(column => column.accessor)
    );
  }, [setHiddenColumns, columns]);

  let op = useRef(null);

  const [currentpage, setcurrentPage] = React.useState(0);
  const [currentrows, setcurrentRows] = React.useState(defaultpagesize);
  const [custompagevalue,setcustompagevalue] = React.useState();
  
  const onPagination = (e) => {
    gotoPage(e.page);
    setcurrentPage(e.first);
    setcurrentRows(e.rows);
    setPageSize(e.rows)
    if([10,25,50,100].includes(e.rows)){
      setcustompagevalue();
    }
  };

  const onCustomPage = (e) => {
    if(typeof custompagevalue === 'undefined' || custompagevalue == null) return;
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

  const onToggleChange = (e) =>{
    let lsToggleColumns = [];
    allColumns.forEach( acolumn =>{
      let jsonobj = {};
      let visible = (acolumn.Header === e.target.id) ? ((acolumn.isVisible)?false:true) :acolumn.isVisible
      jsonobj['Header'] = acolumn.Header;
      jsonobj['isVisible'] = visible;
      lsToggleColumns.push(jsonobj) 
    })
    localStorage.setItem(tablename,JSON.stringify(lsToggleColumns))
  }

  filteredData = _.map(rows, 'values');
  if (parentCallbackFunction) {
    parentCallbackFunction(filteredData);
  }
  
  return (
    <>
     <div id="block_container"> 
     { allowColumnSelection &&
          <div   style={{textAlign:'left', marginRight:'30px'}}>
                <i className="fa fa-columns col-filter-btn" label="Toggle Columns" onClick={(e) => op.current.toggle(e)}  /> 
                <OverlayPanel ref={op} id="overlay_panel" showCloseIcon={false} >
                  <div>
                      <div style={{textAlign: 'center'}}>
                        <label>Select column(s) to view</label>
                      </div>
                      <div style={{float: 'left', backgroundColor: '#d1cdd936', width: '250px', minHeight: '100px', maxHeight: '300px' , overflow: 'auto', marginBottom:'10px', padding:'5px'}}>
                      <div id="tagleid"  >
                        <div >
                          <div style={{marginBottom:'5px'}}>
                            <IndeterminateCheckbox {...getToggleHideAllColumnsProps()} /> Select All
                          </div>
                          {allColumns.map(column => (
                            <div key={column.id} style={{'display':column.id !== 'actionpath'?'block':'none'}}> 
                                <input type="checkbox" {...column.getToggleHiddenProps()} 
                                id={(defaultheader[column.id])?defaultheader[column.id]:(optionalheader[column.id]?optionalheader[column.id]:column.id)}
                                onClick={onToggleChange}
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
        <div  style={{textAlign:'right'}}>
        {tbldata.length>0 && !isunittest && showGlobalFilter &&
              <GlobalFilter
                preGlobalFilteredRows={preGlobalFilteredRows}
                globalFilter={state.globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
            }
        </div>
        { showTopTotal &&
          <div className="total_records_top_label"> <label >Total records ({data.length})</label></div>
        }
  </div>

      <div className="table_container">
      <table {...getTableProps()} data-testid="viewtable" className="viewtable" >
        <thead>
          {headerGroups.map(headerGroup =>  (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th> 
                  <div {...column.getHeaderProps(column.getSortByToggleProps())}>
                    {column.Header !== 'actionpath' && column.render('Header')}
                    {column.Header !== 'Action'? 
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
                  if(cell.column.id !== 'actionpath')
                    return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  else 
                    return "";
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
      <div className="pagination p-grid">
        <div className="total_records_bottom_label" ><label >Total records ({data.length})</label></div>
        <div>
         <Paginator rowsPerPageOptions={[10,25,50,100]} first={currentpage} rows={currentrows} totalRecords={rows.length} onPageChange={onPagination} >  </Paginator> 
        </div>
        <div>
            <InputNumber id="custompage" value={custompagevalue} onChange ={onChangeCustompagevalue}
              min={0}  />
              <label >Records/Page</label>
            <Button onClick={onCustomPage} style={{width: "50px"}}> Show </Button>
            <Button onClick={onShowAllPage} style={{marginLeft: "1em", width: "80px"}}> Show All </Button>
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
    parentCallbackFunction = props.filterCallback; 
    isunittest = props.unittest;
    columnclassname = props.columnclassname;
    showTopTotal = props.showTopTotal===undefined?true:props.showTopTotal;
    showGlobalFilter = props.showGlobalFilter===undefined?true:props.showGlobalFilter;
    showColumnFilter = props.showColumnFilter===undefined?true:props.showColumnFilter;
    allowColumnSelection = props.allowColumnSelection===undefined?true:props.allowColumnSelection;
    // Default Header to show in table and other columns header will not show until user action on UI
    let defaultheader = props.defaultcolumns;
    let optionalheader = props.optionalcolumns;
    let defaultSortColumn = props.defaultSortColumn;
    let tablename = (props.tablename)?props.tablename:window.location.pathname;

    if(!defaultSortColumn){
      defaultSortColumn =[{}];
    }
    let defaultpagesize = (typeof props.defaultpagesize === 'undefined' || props.defaultpagesize == null)?10:props.defaultpagesize;
    let columns = [];   
    let defaultdataheader =  Object.keys(defaultheader[0]);
    let optionaldataheader =  Object.keys(optionalheader[0]);
    
    if(props.showaction === 'true') {
      columns.push({
          Header: 'Action',
          id:'Action',
          accessor: props.keyaccessor,
          Cell: props => <button className='p-link'  onClick={navigateTo(props)} ><i className="fa fa-edit" style={{cursor: 'pointer'}}></i></button>,
          disableFilters: true,
          disableSortBy: true,
          isVisible: defaultdataheader.includes(props.keyaccessor),
        })
     }

     const navigateTo = (props) => () => {
       if(props.cell.row.values['actionpath']){
        return history.push({
          pathname: props.cell.row.values['actionpath'],
          state: { 
            "id": props.value,
          }
        })
       }
     // Object.entries(props.paths[0]).map(([key,value]) =>{})
    }

   //Default Columns
   defaultdataheader.forEach(header =>{
    const isString = typeof defaultheader[0][header] === 'string';
    columns.push({
      Header: isString ? defaultheader[0][header] : defaultheader[0][header].name,
      id: header,
      accessor: header,
      filter: (showColumnFilter?((!isString && defaultheader[0][header].filter=== 'date') ? 'includes' : 'fuzzyText'):""),
      Filter: (showColumnFilter?(isString ? DefaultColumnFilter : (filterTypes[defaultheader[0][header].filter] ? filterTypes[defaultheader[0][header].filter] : DefaultColumnFilter)):""),
      isVisible: true,
      Cell: props => <div> {updatedCellvalue(header, props.value)} </div>,
   })
})

//Optional Columns

optionaldataheader.forEach(header => {
  const isString = typeof optionalheader[0][header] === 'string';
    columns.push({
      Header: isString ? optionalheader[0][header] : optionalheader[0][header].name,
          id: isString ? header : optionalheader[0][header].name,
          accessor: header,
          filter: (showColumnFilter?((!isString && optionalheader[0][header].filter=== 'date') ? 'includes' : 'fuzzyText'):""),
          Filter: (showColumnFilter?(isString ? DefaultColumnFilter : (filterTypes[optionalheader[0][header].filter] ? filterTypes[optionalheader[0][header].filter] : DefaultColumnFilter)):""),
          isVisible: false,
          Cell: props => <div> {updatedCellvalue(header, props.value)} </div>,
      })
}); 
    
    let togglecolumns = localStorage.getItem(tablename);
    if(togglecolumns){
        togglecolumns = JSON.parse(togglecolumns)
        columns.forEach(column =>{
            togglecolumns.filter(tcol => {
               column.isVisible = (tcol.Header === column.Header)?tcol.isVisible:column.isVisible;
               return tcol;
            })
        })
      }
    
    function updatedCellvalue(key, value){
      try{
        if(key === 'blueprint_draft' && _.includes(value,'/task_draft/')){
            //  'task_draft/' -> len = 12
            var taskid = _.replace(value.substring((value.indexOf('/task_draft/')+12), value.length),'/','');
            return  <a href={'/task/view/draft/'+taskid}>{' '+taskid+' '}</a>
        }else if(key === 'blueprint_draft'){
          var retval= [];
          value.forEach((link, index) =>{
            //  'task_blueprint/' -> len = 16
            if(_.includes(link,'/task_blueprint/')){
              var bpid = _.replace(link.substring((link.indexOf('/task_blueprint/')+16), link.length),'/','');
              retval.push( <a href={'/task/view/blueprint/'+bpid} key={bpid+index} >{'  '+bpid+'  '}</a> )
            }
          })
          return  retval;
        }else if(typeof value == "string"){
          const dateval = moment(value, moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
          if(dateval !== 'Invalid date'){
            return dateval;
          } 
        } 
      }catch(err){
        console.error('Error',err)
      }
      return value;
    }
 
  return (
    <div>
        <Table columns={columns} data={tbldata} defaultheader={defaultheader[0]} optionalheader={optionalheader[0]} 
                defaultSortColumn={defaultSortColumn} tablename={tablename} defaultpagesize={defaultpagesize}/>
    </div>
  )
}

export default ViewTable
