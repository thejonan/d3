import "../../math/trigonometry";
import "../../math/abs";
import "../polygon";


function d3_geom_voronoiClipEdges(bounds) {
  var edges = d3_geom_voronoiEdges,
      i = edges.length,
      extent = bounds.extent(),
      e;
  while (i--) {
    e = edges[i];
    if (    !d3_geom_voronoiConnectEdge(e, extent)        // eliminate those outside of the extent of bounding polygon
        ||  !d3_geom_voronoiClipConnectedEdge(e, bounds)  // eliminate those, which disappear after clipping
        ||  (abs(e.a.x - e.b.x) < ε && abs(e.a.y - e.b.y) < ε)) { // i.e. eliminate too short ones.
      e.a = e.b = null;
      edges.splice(i, 1);
    }
  }
}

function d3_geom_voronoiClipConnectedEdge(edge, bounds) {
  var line = bounds.clipLine([[edge.a.x, edge.a.y], [edge.b.x, edge.b.y]]);

  if (!line.length) return false;
    
  edge.a.x = line[0][0];
  edge.a.y = line[0][1];
  edge.b.x = line[1][0];
  edge.b.y = line[1][1];
  return true;
}

function d3_geom_voronoiConnectEdge(edge, extent) {
  var vb = edge.b;
  if (vb) return true;

  var va = edge.a,
      x0 = extent[0][0],
      x1 = extent[1][0],
      y0 = extent[0][1],
      y1 = extent[1][1],
      lSite = edge.l,
      rSite = edge.r,
      lx = lSite.x,
      ly = lSite.y,
      rx = rSite.x,
      ry = rSite.y,
      fx = (lx + rx) / 2,
      fy = (ly + ry) / 2,
      fm,
      fb;

  if (ry === ly) {
    if (fx < x0 || fx >= x1) return;
    if (lx > rx) {
      if (!va) va = {x: fx, y: y0};
      else if (va.y >= y1) return;
      vb = {x: fx, y: y1};
    } else {
      if (!va) va = {x: fx, y: y1};
      else if (va.y < y0) return;
      vb = {x: fx, y: y0};
    }
  } else {
    fm = (lx - rx) / (ry - ly);
    fb = fy - fm * fx;
    if (fm < -1 || fm > 1) {
      if (lx > rx) {
        if (!va) va = {x: (y0 - fb) / fm, y: y0};
        else if (va.y >= y1) return;
        vb = {x: (y1 - fb) / fm, y: y1};
      } else {
        if (!va) va = {x: (y1 - fb) / fm, y: y1};
        else if (va.y < y0) return;
        vb = {x: (y0 - fb) / fm, y: y0};
      }
    } else {
      if (ly < ry) {
        if (!va) va = {x: x0, y: fm * x0 + fb};
        else if (va.x >= x1) return;
        vb = {x: x1, y: fm * x1 + fb};
      } else {
        if (!va) va = {x: x1, y: fm * x1 + fb};
        else if (va.x < x0) return;
        vb = {x: x0, y: fm * x0 + fb};
      }
    }
  }

  edge.a = va;
  edge.b = vb;
  return true;
}
