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
      newEdges,
      pointInside = function (p) { return d3_geom_polygonInside(p, p1, p2) && d3_geom_polygonInside(p, p3, p4) && !d3_geom_polygonInside(p, p2, p3); };

  while (iCell--) {
    cell = cells[iCell];
    if (!cell || !cell.prepare()) continue;
    
    halfEdges = cell.edges;
    nHalfEdges = halfEdges.length;
    iHalfEdge = 0;
    newEdges = [];
    
    while (iHalfEdge < nHalfEdges) {
      end = halfEdges[iHalfEdge].end(), p2 = d3_geom_pointFromVertex(end);
      start = halfEdges[++iHalfEdge % nHalfEdges].start(), p3 = d3_geom_pointFromVertex(start);
      if (!d3_geom_pointsEqual(p2, p3)) {
        p1 = d3_geom_pointFromVertex(halfEdges[iHalfEdge - 1].start());
        p4 = d3_geom_pointFromVertex(halfEdges[iHalfEdge % nHalfEdges].end());
        
        // add the part of bounding polygon, that is inside the existing edges.
        oldInside = pointInside(ba = bounds[bounds.length - 1]);
        for (j = 0;j < bounds.length; ++j, ba = bb, oldInside = inside) {
          inside = pointInside(bb = bounds[j]);
          if (inside && oldInside) 
            newEdges.push(new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, {x: ba[0], y: ba[1]}, {x: bb[0], y: bb[1]}), cell.site, null));
          else if (!oldInside && inside)
            newEdges.push(new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, end, {x: bb[0], y: bb[1]}), cell.site, null));
          else if (oldInside && !inside)
            newEdges.push(new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, {x: ba[0], y: ba[1]}, start), cell.site, null));
          else if (!d3_geom_polygonInside(ba, p1, p2) && !d3_geom_polygonInside(bb, p3, p4) && !d3_geom_polygonInside(ba, p2, p3) && !d3_geom_polygonInside(bb, p2, p3))
            newEdges.push(new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, end, start), cell.site, null));
        }
      }
    }
    
    // we have new edges - add them and order them properly.
    if (newEdges.length > 0) {
      cell.edges = halfEdges.concat(newEdges);
      cell.edges.sort(d3_geom_voronoiHalfEdgeOrder);
    }
  }
}

function d3_geom_voronoiHalfEdgeOrder(a, b) {
  return b.angle - a.angle;
}

function d3_geom_pointFromVertex(v) {
  return [v.x, v.y];
}
