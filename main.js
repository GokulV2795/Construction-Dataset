// DDX Bricks Wiki - See https://developer.domo.com/docs/ddx-bricks/getting-started-using-ddx-bricks
// for tips on getting started, linking to Domo data and debugging your app
 
//Step 1. Select your data from the link in the bottom left corner
 
//Step 2. Style your chart using the following properties 
//--------------------------------------------------
// Properties
//--------------------------------------------------
 
var xAxisTitle = 'Department';
var yAxisTitle = 'Sales';
var seriesColors = ['#B7DAF5', '#4E8CBA', '#73B0D7', '#BBE491', '#559E38',  '#80C25D', '#FDECAD', '#FB8D34', '#FCCF84', '#E45621'];
var legendMarginLeft = 15;



//--------------------------------------------------
// For ultimate flexibility, modify the code below!
//--------------------------------------------------

//Available globals
var domo = window.domo; // For more on domo.js: https://developer.domo.com/docs/dev-studio-guides/domo-js#domo.get
var datasets = window.datasets;

//Data Column Names
var dataXAxisColumnName = 'xAxis';
var dataSeriesColumnName = 'Series';
var dataYAxisColumnName = 'yAxis';

// Form the data query: https://developer.domo.com/docs/dev-studio-guides/data-queries
var fields = [dataXAxisColumnName, dataSeriesColumnName, dataYAxisColumnName];
var groupby = [dataXAxisColumnName, dataSeriesColumnName ];
var query = `/data/v1/${datasets[0]}?fields=${fields.join()}&groupby=${groupby.join()}&orderby=${groupby.join()}`;

//Get the data and chart it
domo.get(query).then(function(data) {
  var d3DataGrid = getD3DataGrid(data);
  chartIt(d3DataGrid);
});

//Convert data to the format D3 expects if from a .csv file
function getD3DataGrid(dataRows){
    var dataGrid = [];
    var columns = [];

    columns.push(dataXAxisColumnName);

    var curRow = {};
    var lastCatName = dataRows[0][dataXAxisColumnName];
    curRow[dataXAxisColumnName] = lastCatName;
    for (var i = 0; i < dataRows.length; i++) 
    { 
        var row = dataRows[i];
        if (row[dataXAxisColumnName] != lastCatName)
        {
          dataGrid.push(curRow);
          curRow = {};
          lastCatName = dataRows[i][dataXAxisColumnName];
          curRow[dataXAxisColumnName] = lastCatName;
        }
        curRow[row[dataSeriesColumnName]] = row[dataYAxisColumnName];
        if (!columns.includes(row[dataSeriesColumnName]))
          columns.push(row[dataSeriesColumnName]);
    }
    dataGrid.push(curRow);
    dataGrid['columns'] = columns;

    return dataGrid;
}

var svg, svgGroup, xAxis, yAxis, groups;
function chartIt(data) {
  var margin = {top: 10, right: 30, bottom: 40, left: 80}

  // Append the svg object to the body of the page
  svg = d3.select("#myDiv").append("svg");
  svgGroup = svg.append("g");

  // List of groups
  groups = d3.map(data, function(d){ return d[dataXAxisColumnName] }).keys();

  // List of subgroups
  var subgroups = data.columns.slice(1);

  drawChartScales(data, margin);
  drawChartBars(data, subgroups);
  drawLegend(subgroups);
}

function drawChartScales(data, margin){
  // Set the dimensions and margins of the graph
  var winHeight = window.innerHeight;
  var winWidth = window.innerWidth;
  var width = winWidth - margin.left - margin.right,
      height = winHeight - margin.top - margin.bottom;

  svg
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  svgGroup
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Add X axis
  xAxis = d3.scaleBand()
    .domain(groups)
    .range([0, width])
    .padding([0.2]);

  svgGroup.append("g")
    .attr("transform", "translate(0," + height + ")")
    .style("font-size", "11px")
    .style("fill", "#777777")
    .call(d3.axisBottom(xAxis).tickSizeOuter(0));
    
  if (xAxisTitle) {
    // Text label for the x axis
    svgGroup.append("text")             
      .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top + 20) + ")")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#333333")
      .text(xAxisTitle);
  }

  var max = d3.max(data, (d) =>
    Object.keys(d).reduce((sum, key) => 
      key !== dataXAxisColumnName ? sum + d[key] : sum
    , 0)
  );

  // Add Y axis
  yAxis = d3.scaleLinear()
    .domain([0, max])
    .range([ height, 0 ]);

  svgGroup.append("g")
    .style("font-size", "11px")
    .call(d3.axisLeft(yAxis));

  if (yAxisTitle) {
    // Text label for the y axis
    svgGroup.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#333333")
      .text(yAxisTitle);
  }
}

function drawChartBars(data, subgroups){
  // Color palette - one color per subgroup
  var color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(seriesColors);

  // Stack data per subgroup
  var stackedData = d3.stack()
    .keys(subgroups)(data);

  // Show the bars
  svgGroup.append("g")
    .selectAll("g")
    // Enter in the stack data = loop key per key = group per group
    .data(stackedData)
    .enter().append("g")
      .attr("fill", function(d) { return color(d.key); })
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(function(d) { return d; })
      .enter().append("rect")
        .attr("x", function(d) { return xAxis(d.data[dataXAxisColumnName]); })
        .attr("y", function(d) { return yAxis(d[1]); })
        .attr("height", function(d) { return yAxis(d[0]) - yAxis(d[1]); })
        .attr("width", xAxis.bandwidth());
}

function drawLegend(subgroups){
  var fontSize = 12;
  var legendChipSize = 12;
  var legend = svgGroup.append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(' + legendMarginLeft + ', 0)');

  var rowHeight = Math.max(legendChipSize, fontSize) * 1.5;

  legend.selectAll('rect')
    .data(subgroups)
    .enter()
    .append('rect')
      .attr('x', 0)
      .attr('y', function(d, i){ return i * rowHeight })
      .attr('width', legendChipSize)
      .attr('height', legendChipSize)
      .attr('fill', function(d, i){ return seriesColors[i] });
  
  legend.selectAll('text')
    .data(subgroups)
    .enter()
    .append('text')
      .text(function(d){ return d })
      .attr('x', legendChipSize * 1.5)
      .attr('y', function(d, i){ return i * rowHeight })
      .attr('text-anchor', 'start')
      .attr('alignment-baseline', 'hanging')
      .style("font-size", fontSize + "px")
      .style("fill", "#333333");
}
