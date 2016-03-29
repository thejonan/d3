import "../core/functor";
import "voronoi/";
import "geom";
import "point";
import "polygon";

d3.geom.voronoi = function(points) {
  var x = d3_geom_pointX,
      y = d3_geom_pointY,
      value = d3_geom_voronoiPointValue,
      fx = x,
      fy = y,
      fv = value,
      clipExtent = d3_geom_voronoiClipExtent;

  // @deprecated; use voronoi(data) instead.
  if (points) return voronoi(points);

  function voronoi(data) {
    var polys = polygons(sites(data));

    polys.forEach(function (polygon, i) {
      polygon.point = data[i];
      delete polygon.cell;
    })
    
    return polys;
  }
  
  function polygons(sites) {
    var polys = new Array(sites.length),
        x0 = clipExtent[0][0],
        y0 = clipExtent[0][1],
        x1 = clipExtent[1][0],
        y1 = clipExtent[1][1];

    d3_geom_voronoi(sites, clipExtent).cells.forEach(function(cell, i) {
      var edges = cell.edges,
          site = cell.site,
          poly;
        polys[i] = poly = edges.length ? edges.map(function(e) { var s = e.start(); return [s.x, s.y]; })
          : site.x >= x0 && site.x <= x1 && site.y >= y0 && site.y <= y1 ? [[x0, y1], [x1, y1], [x1, y0], [x0, y0]]
          : [];
        poly.cell = cell;
    });
    
    return polys;
  }

  function sites(data) {
    return data.map(function(d, i) {
      return {
        x: Math.round(fx(d, i) / ε) * ε,
        y: Math.round(fy(d, i) / ε) * ε,
        v: Math.round(fv(d, i) / ε) * ε,
        i: i
      };
    });
  }
  
  voronoi.links = function(data) {
    return d3_geom_voronoi(sites(data)).edges.filter(function(edge) {
      return edge.l && edge.r;
    }).map(function(edge) {
      return {
        source: data[edge.l.i],
        target: data[edge.r.i]
      };
    });
  };

  voronoi.triangles = function(data) {
    var triangles = [];

    d3_geom_voronoi(sites(data)).cells.forEach(function(cell, i) {
      var site = cell.site,
          edges = cell.edges.sort(d3_geom_voronoiHalfEdgeOrder),
          j = -1,
          m = edges.length,
          e0,
          s0,
          e1 = edges[m - 1].edge,
          s1 = e1.l === site ? e1.r : e1.l;

      while (++j < m) {
        e0 = e1;
        s0 = s1;
        e1 = edges[j].edge;
        s1 = e1.l === site ? e1.r : e1.l;
        if (i < s0.i && i < s1.i && d3_geom_voronoiTriangleArea(site, s0, s1) < 0) {
          triangles.push([data[i], data[s0.i], data[s1.i]]);
        }
      }
    });

    return triangles;
  };
  
  // LLoyd relaxation for finding centroidal voronoi tessellation
  voronoi.centroidal = function(data, maxsteps, stepfn) {
		var err = 0,
        polys = null;

    if (typeof maxsteps === "function")
      stepfn = maxsteps, maxsteps = 100;
    else if (!maxsteps)
      maxsteps = 100;
      
    var cells = sites(data);
			
		for (;maxsteps > 0; --maxsteps) {
			var err = 0,
			    polys = polygons(cells.slice());
						   
			for (var i = 0;i < polys.length; ++i) {
				var c = d3.geom.polygon(polys[i]).centroid(),
				    d = [c[0] - cells[i].x, c[1] - cells[i].y];
				
				err += d[0] * d[0] + d[1] * d[1];
				cells[i].x = c[0];
				cells[i].y = c[1];
			}
			
			err = Math.sqrt(err / polys.length);
			if (!!stepfn)
			  stepfn(polys, err, maxsteps);
			  
			if ( err <= 1.0) break;
		}
		
    polys.forEach(function (p, i) { 
      p.centroid = cells[i];
      p.point = data[i];
    });		

    return polys;	  
  };

  voronoi.x = function(_) {
    return arguments.length ? (fx = d3_functor(x = _), voronoi) : x;
  };

  voronoi.y = function(_) {
    return arguments.length ? (fy = d3_functor(y = _), voronoi) : y;
  };
  
  voronoi.value = function (_) {
    return arguments.length ? (fv = d3_functor(value = _), voronoi) : value;
  };
  
  voronoi.clipExtent = function(_) {
    if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent;
    clipExtent = _ == null ? d3_geom_voronoiClipExtent : _;
    return voronoi;
  };
  
  // @deprecated; use clipExtent instead.
  voronoi.size = function(_) {
    if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent && clipExtent[1];
    return voronoi.clipExtent(_ && [[0, 0], _]);
  };

  return voronoi;
};

var d3_geom_voronoiClipExtent = [[-1e6, -1e6], [1e6, 1e6]];

function d3_geom_voronoiTriangleArea(a, b, c) {
  return (a.x - c.x) * (b.y - a.y) - (a.x - b.x) * (c.y - a.y);
}

function d3_geom_voronoiPointValue(d) {
  return d[2] || 1;
}
