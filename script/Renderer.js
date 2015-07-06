/*
    Renderer class for main screen
*/
function Renderer(data, titleData) {
    initializePos(data);

    this.svg = d3.select("body")
            .append("svg")
            .attr("id", "svg")
            .attr("height", height)
            .attr("width", width);

    this.pool = this.svg.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", poolHeight)
                .attr("id", "pool");

    this.instructionClickText = this.svg.append("text")
                                .classed("instructionClick", true)
                                .attr("x", instructionClickTextX)
                                .attr("y", poolHeight - nodeGap)
                                .text("Click box to display data.");

    this.instructionDragText = this.svg.append("text")
                                .classed("instructionDrag", true)
                                .attr("x", offsetLeft)
                                .attr("y", poolHeight - nodeGap)
                                .text("Drag and drop node here to filter data.");

    this.force = d3.layout.force()
                          .nodes(data)
                          .size([width, height])
                          .charge(0)
                          .gravity(0)
                          .start();

    this.nodes = this.svg.selectAll("g")
                .data(data)
                .enter()
                .append("g")
                .call(drag());

    this.nodes.append("rect")
        .attr("width", function (d) { return d.width; })
        .attr("height", nodeHeight)
        .attr("class", function (d) { return d.type; });

    this.nodes.append("text")
        .style("font-size", textHeight)
        .attr("textLength", function (d) { return d.textLength; })
        .attr("dy", function (d, i) { return textHeight / 2; })
        .attr("x", nodeHeight / 4)
        .attr("y", nodeHeight / 2)
        .text(function (d) { return d.text; })

    this.title = this.svg.selectAll(".title")
                    .data(titleData)
                    .enter()
                    .append("text")
                    .classed("title", true)
                    .text(function (d) { return d.text })
                    .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });;

    this.resultText = this.svg.append("text")
                                .classed("result", true)
                                .attr("x", resultTextX)
                                .attr("y", poolHeight - nodeGap)
                                .text("Result count:");


}

/*
    Calculate fixed position for given data
        1. Trying to place objects one ofter one,if exceed the width limit, start a new line
        2. Place a gap between groups for displaying title
        3. Return the height of the last item
*/
function calculateFixedPos(array) {
    array.sort(function (a, b) { return a.group * 100 + a.index - b.group * 100 - b.index });

    var x = offsetLeft, y = offsetTop + groupGap;
    for (var i = 0; i < array.length; i++) {
        array[i].fixedX = x;
        array[i].fixedY = y;

        if (i + 1 < array.length) {
            if (array[i].group != array[i + 1].group) {
                x = offsetLeft;
                y = y + groupGap + nodeHeight;
                continue;
            }

            var newWidth = x + array[i].width + nodeGap
                            + array[i + 1].width - offsetLeft;
            if (newWidth <= widthLimit) {
                x = x + array[i].width + nodeGap;
            } else {
                x = offsetLeft;
                y = y + nodeGap + nodeHeight;
            }
        }
    }

    return y;
}

function initializePos(data){
    for (var i = 0; i < data.length; i++) {
        data[i].x = data[i].fixedX;
        data[i].y = data[i].fixedY;
        data[i].originalX = data[i].fixedX;
        data[i].originalY = data[i].fixedY;
    }
}

function dragStart(renderer) {
    renderer.force.stop();
}

/*
    move the node while dragging,
    if the node is disabled(fixed), don't move it.
*/
function dragMove(d, filters, data, renderer) {
    if (d.fixed) {
        return;
    }
    d.px += d3.event.dx;
    d.py += d3.event.dy;
    d.x += d3.event.dx;
    d.y += d3.event.dy;

    renderer.nodes.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
}

function dragEnd(d, filters, data, renderer) {
    renderer.nodes.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
    renderer.force.resume();
}

/*
    place filters in the pool one after one
    then update filters(disable, highlight)
*/
function tickNode(alpha, map, filters) {
    var x = offsetLeft, y = (poolHeight - nodeHeight) / 2;
    return function (d) {
        if (isInPool(d)) {
            d.fixedX = x;
            d.fixedY = y;
            x += d.width + nodeGap;
        } else {
            d.fixedX = d.originalX;
            d.fixedY = d.originalY;
        }
        d.y += (d.fixedY - d.y) * alpha;
        d.x += (d.fixedX - d.x) * alpha;

        updateFilter(map, filters, d, d3.select(this));
    }
}

/*
    if half of the node is in the pool then return true;
*/
function isInPool(d) {
    return d.y < poolHeight - nodeHeight/2;
}

/*
    return value format:
        array of object:
            {
            type: "type",
            text:"text"
            }
            type includes: team, country, year, graph, venue
            text is the displaying names
*/
function getSelectFilters(filters) {
    var selectedNodes = [];
    for (var i = 0; i < filters.length; i++) {
        if (isInPool(filters[i])) {
            selectedNodes.push(filters[i]);
        }
    }
    return selectedNodes;
}

/*
    return value format:
        array of object:
            {
            year:2008,
            round:1,
            datetime,
            homeTeam:"homeTeam",
            awayTeam:"awayTeam",
            homeTeamScore: 50,
            awayTeamScore: 60,
            venue:"venue"
            }
*/
function applyFilters(filters, data) {
    var filteredData = [];

    if (filters.length == 0) {
        return data;
    }

    for (var i = 0; i < data.length; i++) {
        if (applyFiltersToSingleRecord(filters, data[i])) {
            //pass all the filters
            filteredData.push(data[i]);
        }
    }

    return filteredData;
}

/*
    The record should match given filters.
        1. team filter will pick up the record if the record's home team or away team matchs the filter
        2. country filter will pick up the record that the home team country is equals to the given country
        3. graph filter do nothing to the data, will be used to decide what graph to draw
        4. season filter will pick up record that matches given season(regular or final).
        5. other filters will pick up the record which have the same value
*/
function applyFiltersToSingleRecord(filters, record) {
    for (var i = 0; i < filters.length; i++) {
        //team filter will select records that matches either home team or away team
        if (filters[i].type == "team") {
            if (record.homeTeam != filters[i].text && record.awayTeam != filters[i].text) {
                return false;
            }
        } else if (filters[i].type == "graph") {
            // do nothing
        } else if (filters[i].type == "country") {
            // the country filter will accept the record that is:
            // 1. the home team country equals given country
            // (to be deside)2. the away team country not equals given country
            var homeTeamCountry = getTeamCountry(record.homeTeam);
            //var awayTeamCountry = getTeamCountry(record.awayTeam);
            if (homeTeamCountry != filters[i].text){ //&& awayTeamCountry != filters[i].text) {
                return false;
            }
            //if (awayTeamCountry == filters[i].text) {
                //return false;
            //}
        } else if (filters[i].type == "season") {
            if (filters[i].text == "final") {
                if (!isFinal(record)) {
                    //the filter is final, but the record is regular
                    return false;
                }
            } else {
                if (isFinal(record)) {
                    //the filter is regular, but the record is final
                    return false;
                }
            }
        } else {
            //other filters, should match the value in the record
            if (record[filters[i].type] != filters[i].text) {
                return false;
            }
        }
    }
    return true;
}

/*
    update filter nodes based on the given data
        if there no data matchs this filter, disable it.
        if user selected a country, will highlight the teams belong to the country
*/
function updateFilter(map, filters, d, node) {
    node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
    var rect = node.select("rect");
    var disable = true;
    var country = getFilterByType(filters, "country");
    var graph = getFilterByType(filters, "graph");

    if (filters.length == 0) {
        disable = false;
    }

    if (d.type == "team") {
        //highlight the team belongs to given country
        if (country && getTeamCountry(d.text) == country.text) {
            rect.classed("highlight", true);
        } else {
            rect.classed("highlight", false);
        }
        if (map[d.text]) {
            disable = false;
        }
    } else if (d.type == "country") {
        if (!country) {
            //check if there are records for this country
            if (map[d.text]) {
                disable = false;
            }
        } else if (country.text == d.text) {
            //only enable selected country, disable other countries
            disable = false;
        }

    } else if (d.type == "graph") {
        //do not disable graph
        if (graph) {
            if (graph.text == d.text) {
                disable = false;
            } else {
                disable = true;
            }
        } else {
            disable = false;
        }
    } else {
        //other filters
        if (map[d.text]) {
            disable = false;
        }
    }

    node.classed("disable", disable);
    d.fixed = disable;
}

function getFilterByType(filters, type) {
    for (var i = 0; i < filters.length; i++) {
        if (filters[i].type == type) {
            return filters[i];
        }
    }
    return null;
}
