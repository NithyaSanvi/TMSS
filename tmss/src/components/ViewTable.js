import React, {useRef } from "react";
import styled from 'styled-components'
import { useSortBy, useTable, useFilters, useGlobalFilter, useAsyncDebounce } from 'react-table'
import matchSorter from 'match-sorter'
import _ from 'lodash';
import moment from 'moment';
import { useHistory } from "react-router-dom";
import {OverlayPanel} from 'primereact/overlaypanel';

const Styles = styled.div`
  padding: 1rem;
  table {
    border-spacing: 0;
     
    th {
      vertical-align: middle!important;
      color: #7e8286;
      font-size: 14px;
      border-bottom: 1px solid lightgray;
      border-top: 1px solid lightgray;
      padding: .65rem;
    }  
    
    td {
      padding: .65rem;
      border-bottom: 1px solid lightgray;
    } 

    thead>tr>:nth-child(1){
      div {
        display: none;
      } 
     }
  }
`
let dataheader = [] ;
let tbldata =[];
 
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
function Table({ columns, data }) {

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
                            <div key={column.id}>
                              <input type="checkbox" {...column.getToggleHiddenProps()} />{' '} {_.startCase(column.id)}
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
            {tbldata.length>0 &&
                  <GlobalFilter
                    preGlobalFilteredRows={preGlobalFilteredRows}
                    globalFilter={state.globalFilter}
                    setGlobalFilter={setGlobalFilter}
                  />
                }
        </div>
         
</div>
      <Styles style={{overflow: 'auto', padding: '0.75em',}}>
      <table {...getTableProps()} style={{width:'100%'}}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
               <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>
                  {column.isSorted ? (column.isSortedDesc ? <i className="fa fa-sort-desc" aria-hidden="true"></i> : <i className="fa fa-sort-asc" aria-hidden="true"></i>) : ""}
                </span>
                  {/* Render the columns filter UI */}
                  <div>{column.canFilter ? column.render('Filter') : null}</div>
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
                  return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      </Styles>
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
    // Default Header to show in table and other columns header will not show until user action on UI
    let defaultheader = props.defaultcolumns;
    let columns = [];   
    let defaultdataheader =  Object.keys(defaultheader[0]);
    if(props.showaction === 'true'){
      columns.push({
          Header: 'Action',
          id:'action',
          accessor: 'id',
          Cell: props => <button className='p-link'  onClick={navigateTo(props.value)} ><i className="fa fa-edit" style={{cursor: 'pointer'}}></i></button>,
          disableFilters: true,
          disableSortBy: true,
          isVisible: defaultdataheader.includes('id'),
        })
     }

    defaultdataheader.forEach(header =>{
        columns.push({
        Header: defaultheader[0][header],
        accessor: header,
        filter: 'fuzzyText',
        isVisible: true,
        Cell: props => <div> {dateformat(props.value)} </div>,
        minWidth: 20,
       })
    })

    dataheader =  Object.keys(tbldata[0]);
    dataheader.forEach(header => {
      if(!defaultdataheader.includes(header)){
      var text = _.startCase(header);
      columns.push({
         Header: text,
         accessor: header,
         filter: 'fuzzyText',
         isVisible: defaultheader.includes(header),
         Cell: props => <div> {dateformat(props.value)} </div>,
         minWidth: 20,
        })
      }
    }); 

    function dateformat(date){
      try{
        if(date && date.length===26){
          var result = moment(date).format("YYYY-MM-DD HH:mm:SS")
          if(result === 'Invalid date'){
              return date;
          }else{
            return result;
          }
        }
      }catch(err){
        console.err('Error',err)
      }
      return date;
    }

  //  if(columns.length>0 && props.showaction === 'true'){
  //   columns.push(
  //     {
  //       Header: 'Action',
  //       Cell: row =>  
  //               <a  onClick={navigateTo} href ><i className="pi pi-pencil" style={{cursor: 'pointer'}}></i></a>,
  const navigateTo = (id) => () => {
    Object.entries(props.paths[0]).map(([key,value]) =>{
     return history.push({
        pathname: value,
        state: { 
          "id": id,
        }
      })
    })
  }
   
  return (
    <div  >
      
        <Table columns={columns} data={tbldata} className="-striped -highlight" />
      
    </div>
  )
}

export default ViewTable
