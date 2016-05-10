import "../polygon";

function d3_geom_voronoiCell(site) {
  this.site = site;
  this.edges = [];
}

// sort and remove those, which correposnd to disconnected edges
d3_geom_voronoiCell.prototype.prepare = function() {
  var halfEdges = this.edges,
      iHalfEdge = halfEdges.length,
      edge;

  while (iHalfEdge--) {
    edge = halfEdges[iHalfEdge].edge;
    if (!edge.b || !edge.a) halfEdges.splice(iHalfEdge, 1);
  }

  halfEdges.sort(d3_geom_voronoiHalfEdgeOrder);
  return halfEdges.length;
};

function d3_geom_voronoiCloseCells(bounds) {
  var p1, p2, p3, p4,
      cells = d3_geom_voronoiCells,
      iCell = cells.length,
      cell,
      iHalfEdge, halfEdges, nHalfEdges,
      start, end,
      ba, bb, j, oldInside, inside,
      newEdges;

  while (iCell--) {
    cell = cells[iCell];
    if (!cell || !cell.prepare()) continue;
    
    halfEdges = cell.edges;
    nHalfEdges = halfEdges.length;
    iHalfEdge = 0;
    
    while (iHalfEdge < nHalfEdges) {
      end = halfEdges[iHalfEdge].end(), p2 = d3_geom_pointFromVertex(end);
      start = halfEdges[++iHalfEdge % nHalfEdges].start(), p3 = d3_geom_pointFromVertex(start);
      if (!d3_geom_pointsEqual(p2, p3)) {
        newEdges = [];
        p1 = d3_geom_pointFromVertex(halfEdges[iHalfEdge - 1].start());
        p4 = d3_geom_pointFromVertex(halfEdges[iHalfEdge % nHalfEdges].end());
        
        // add the part of bounding polygon, that is inside the existing edges.
        ba = bounds[bounds.length - 1];
        oldInside = d3_geom_polygonInside(ba, p1, p2) && d3_geom_polygonInside(ba, p3, p4); 
        for (j = 0;j < bounds.length; ++j, ba = bb, oldInside = inside) {
          bb = bounds[j];
          inside = d3_geom_polygonInside(bb, p1, p2) && d3_geom_polygonInside(bb, p3, p4);
          if (!inside && !oldInside)
            continue;
          else if (inside && oldInside) 
            newEdges.push(new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, {x: bb[0], y: bb[1]}, {x: ba[0], y: ba[1]}), cell.site, null));
          else if (!oldInside && inside)
            newEdges.push(new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, {x: bb[0], y: bb[1]}, end), cell.site, null));
          else
            newEdges.push(new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, start, {x: ba[0], y: ba[1]}), cell.site, null));
        }
        
        // we need to construct newEdges as parameter list for splice call
        newEdges.sort(d3_geom_voronoiHalfEdgeOrder).reverse();
        newEdges.splice(0, 0, iHalfEdge, 0);
        halfEdges.splice.apply(halfEdges, newEdges);
        
        // finally we need to reorder them...
//         halfEdges.sort(d3_geom_voronoiHalfEdgeOrder);
      }
    }
  }
}

function d3_geom_voronoiHalfEdgeOrder(a, b) {
  return b.angle - a.angle;
}

function d3_geom_pointFromVertex(v) {
  return [v.x, v.y];
}
