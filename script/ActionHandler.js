/*
    Append action handler to renderer and graphPad
*/
function appendHandlers(filters, data, renderer, graphPad) {

    renderer.nodes.call(drag(filters, data, renderer))

    renderer.force.on("tick", function (e) { tick(e, filters, data, renderer);})

    renderer.pool.on("click", function () { openGraphPad(filters, data, graphPad); });

    graphPad.closeButton.on("click", function () { closeGraphPad(graphPad); })
}

/*
    handle the drag event
*/
function drag(filters, data, renderer) {
    return d3.behavior.drag()
                    .on("dragstart", function (d, i) { dragStart(renderer); })
                    .on("drag", function (d, i) { dragMove(d, filters, data, renderer); })
                    .on("dragend", function (d, i) { dragEnd(d, filters, data, renderer); });
}

/*
    close graph pad
*/
function closeGraphPad(graphPad) {
    graphPad.pad.style("display", "none");
	
    removeGraph(graphPad.graph);
}
/*
    display filtered data
*/
function openGraphPad(filters, data, graphPad) {
    
    var selectFilters = getSelectFilters(filters);
    var filteredData = applyFilters(selectFilters, data);
    var filterMap = createFilterMap(selectFilters);
	
    graphPad.graph = createGraph(filterMap, filteredData, "line", graphPad.pad);

    graphPad.pad.style("display", "block");
}

/*
    will be called every frame
*/
function tick(e, filters, data, renderer) {
    var selectFilters = getSelectFilters(filters);
    var filteredData = applyFilters(selectFilters, data);
    var map = categorizeData(filteredData);

    renderer.nodes.each(tickNode(e.alpha * 0.3, map, selectFilters));

    renderer.resultText.text("Result Count: " + filteredData.length);
    renderer.instructionDragText.style("display", function () { return selectFilters.length > 0 ? "none" : "block"; });
}
