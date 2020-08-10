import React, {useRef } from "react";
import { useSortBy, useTable, useFilters, useGlobalFilter, useAsyncDebounce } from 'react-table'
import matchSorter from 'match-sorter'
import _ from 'lodash';
import moment from 'moment';
import { useHistory } from "react-router-dom";
import {OverlayPanel} from 'primereact/overlaypanel';


let tbldata =[];
let isunittest = false;
let columnclassname =[];
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
  column: { filterValue, preFilteredRows, setFilter },
}) {
  return (
    <input
      value={filterValue || ''}
      onChange={e => {
        setFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
      }}
    />
  )
}

function fuzzyTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, { keys: [row => row.values[id]] })
}

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
function Table({ columns, data, defaultheader, optionalheader }) {
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
    preGlobalFilteredRows,
    setGlobalFilter,
    setHiddenColumns,
  } = useTable(
      {
        columns,
        data,
        defaultColumn,
        filterTypes,
      },
      useFilters,
      useGlobalFilter,
      useSortBy,   
    )

  React.useEffect(() => {
    setHiddenColumns(
      columns.filter(column => !column.isVisible).map(column => column.accessor)
    );
  }, [setHiddenColumns, columns]);

  const firstPageRows = rows.slice(0, 10)
  let op = useRef(null);

  return (
    <>
     <div id="block_container" style={{ display: 'flex',  verticalAlign: 'middle', marginTop:'20px'}}> 
          <div   style={{textAlign:'left', marginRight:'30px'}}>
                <i className="fa fa-columns col-filter-btn" label="Toggle Columns" onClick={(e) => op.current.toggle(e)}  />
                <OverlayPanel ref={op} id="overlay_panel" showCloseIcon={false} >
                  <div>
                      <div style={{textAlign: 'center'}}>
                        <label>Select column(s) to view</label>
                      </div>
                      <div style={{float: 'left', backgroundColor: '#d1cdd936', width: '250px', height: '400px', overflow: 'auto', marginBottom:'10px', padding:'5px'}}>
                      <div id="tagleid"  >
                        <div >
                          <div style={{marginBottom:'5px'}}>
                            <IndeterminateCheckbox {...getToggleHideAllColumnsProps()} /> Select All
                          </div>
                          {allColumns.map(column => (
                            <div key={column.id} style={{'display':column.id !== 'actionpath'?'block':'none'}}> 
                                <input type="checkbox" {...column.getToggleHiddenProps()}  /> {(defaultheader[column.id])?defaultheader[column.id]:(optionalheader[column.id]?optionalheader[column.id]:column.id)}
                            </div>
                          ))}
                          <br />
                        </div>
                      </div>
                    </div>
                  </div>
                </OverlayPanel>
            </div> 
                
        <div  style={{textAlign:'right'}}>
        {tbldata.length>0 && !isunittest && 
              <GlobalFilter
                preGlobalFilteredRows={preGlobalFilteredRows}
                globalFilter={state.globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
            }
        </div>
</div>

      <div style={{overflow: 'auto', padding: '0.75em',}}>
      
      <table {...getTableProps()} style={{width:'100%'}} data-testid="viewtable" className="viewtable" >
        <thead>
          {headerGroups.map(headerGroup =>  (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                 <th {...column.getHeaderProps(column.getSortByToggleProps())}  > 
                    {column.Header !== 'actionpath' && column.render('Header')}
                    {/* {column.Header !== 'Action'? 
                      column.isSorted ? (column.isSortedDesc ? <i className="pi pi-sort-down" aria-hidden="true"></i> : <i className="pi pi-sort-up" aria-hidden="true"></i>) : <i className="pi pi-sort" aria-hidden="true"></i>
                      : ""
                    } */}
                    {/* Render the columns filter UI */} 
                    {column.Header !== 'actionpath' &&
                      <div className={columnclassname[0][column.Header]}  > {column.canFilter && column.Header !== 'Action' ? column.render('Filter') : null}</div>
                    }
                  </th> 
              ))}
            </tr>
          ))}
         
        </thead>
        <tbody {...getTableBodyProps()}>
          {firstPageRows.map((row, i) => {
            
            prepareRow(row)
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => { 
                  if(cell.column.id !== 'actionpath')
                   return <td {...cell.getCellProps()}  >{cell.render('Cell')}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
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
    isunittest = props.unittest;
    columnclassname = props.columnclassname;
     
    // Default Header to show in table and other columns header will not show until user action on UI
    let defaultheader = props.defaultcolumns;
    let optionalheader = props.optionalcolumns;
    
    let columns = [];   
    let defaultdataheader =  Object.keys(defaultheader[0]);
    let optionaldataheader =  Object.keys(optionalheader[0]);
    
    if(props.showaction === 'true'){
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
        columns.push({
        Header: defaultheader[0][header],
        id: defaultheader[0][header],
        accessor: header,
        filter: 'fuzzyText',
        isVisible: true,
        Cell: props => <div> {updatedCellvalue(header, props.value)} </div>,
       })
    })

    //Optional Columns
    optionaldataheader.forEach(header => {
        columns.push({
          Header: optionalheader[0][header],
          id: header,
          accessor: header,
          filter: 'fuzzyText',
          isVisible: false,
          Cell: props => <div> {updatedCellvalue(header, props.value)} </div>,
          })
    }); 
     
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
          const dateval = moment(value, moment.ISO_8601).format("YYYY-MMM-DD HH:mm:SS");
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
        <Table columns={columns} data={tbldata} defaultheader={defaultheader[0]} optionalheader={optionalheader[0]} />
    </div>
  )
}

export default ViewTable
