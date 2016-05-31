import "../core/subclass";
import "../math/abs";
import "../math/trigonometry";
import "geom";

d3.geom.polygon = function(coordinates) {
  d3_subclass(coordinates, d3_geom_polygonPrototype);
  return coordinates;
};

var d3_geom_polygonPrototype = d3.geom.polygon.prototype = Array.prototype;

d3_geom_polygonPrototype.closed = function() {
  if (!d3_geom_polygonClosed(this))
    this.push(this[0]);
  return this;
};

d3_geom_polygonPrototype.unclosed = function() {
  if (d3_geom_polygonClosed(this))
    this.pop();
  return this;
};

d3_geom_polygonPrototype.area = function() {
  var i = -1,
      n = this.length,
      a,
      b = this[n - 1],
      area = 0;

  while (++i < n) {
    a = b;
    b = this[i];
    area += a[1] * b[0] - a[0] * b[1];
  }

  return area * 0.5;
};

d3_geom_polygonPrototype.centroid = function() {
  var i = -1,
      n = this.length,
      x = 0,
      y = 0,
      a,
      b = this[n - 1],
      c,
      k = 0;

  while (++i < n) {
    a = b;
    b = this[i];
    c = a[0] * b[1] - b[0] * a[1];
    k += c;
    x += (a[0] + b[0]) * c;
    y += (a[1] + b[1]) * c;
  }

  k *= 3;
  return [x / k, y / k];
};

// The Sutherland-Hodgman clipping algorithm.
// Note: requires the clip polygon to be counterclockwise and convex.
d3_geom_polygonPrototype.clip = function(subject) {
  var input,
      subprot = subject.prototype,
      closed = d3_geom_polygonClosed(subject),
      i = -1,
      n = this.length - d3_geom_polygonClosed(this),
      j,
      m,
      a = this[n - 1],
      b,
      c,
      d;

  while (++i < n) {
    input = subject;
    subject = [];
    b = this[i];
    c = input[(m = input.length - closed) - 1];
    j = -1;
    while (++j < m) {
      d = input[j];
      if (d3_geom_polygonInside(d, a, b)) {
        if (!d3_geom_polygonInside(c, a, b)) {
          subject.push(d3_geom_polygonIntersect(c, d, a, b));
        }
        subject.push(d);
      } else if (d3_geom_polygonInside(c, a, b)) {
        subject.push(d3_geom_polygonIntersect(c, d, a, b));
      }
      c = d;
    }
    if (closed) subject.push(subject[0]);
    a = b;
  }

  subject.prototype = subprot;
  return subject;
};

// Clips a single line to be entirely inside the polygon, 
// or null if it is entirely outside.
d3_geom_polygonPrototype.clipLine = function (line) {
  var n = this.length - d3_geom_polygonClosed(this),
      a = this[n - 1],
      b,
      c = line[0],
      d = line[1];

  for (var i = 0;i < n; ++i, a = b) {
    b = this[i];
    if (d3_geom_polygonInside(d, a, b)) {
      if (!d3_geom_polygonInside(c, a, b)) {
        c = d3_geom_polygonIntersect(c, d, a, b);
      }
    } 
    else if (d3_geom_polygonInside(c, a, b))
      d = d3_geom_polygonIntersect(c, d, a, b);
    else
      return [];  
  }
  
  return [c, d];
};

d3_geom_polygonPrototype.inside = function (point) {
  var n = this.length - d3_geom_polygonClosed(this),
      a = this[n - 1],
      b;

  for (var i = 0;i < n; ++i, a = b) {
    b = this[i];
    if (!d3_geom_polygonInside(point, a, b))
      return;
  }
  
  return true;
};

d3_geom_polygonPrototype.extent = function () {
  var min = [1e6, 1e6],
      max = [-1e6, -1e6],
      a;
        
  for (var i = 0;i < this.length; ++i) {
    a = this[i];
    if (a[0] < min[0])
      min[0] = a[0];
    if (a[0] > max[0])
      max[0] = a[0];
      
    if (a[1] < min[1])
      min[1] = a[1];
    if (a[1] > max[1])
      max[1] = a[1];
  }
  
  return [min, max];
}

d3_geom_polygonPrototype.transform = function (ctm) {
  var out = new Array(this.length),
      a;
      
  d3_subclass(out, d3_geom_polygonPrototype);
  for (var i = 0;i < this.length; ++i) {
    a = this[i];
    out[i] = [ ctm.a * a[0] + ctm.c * a[1] + ctm.e, ctm.b * a[0] + ctm.d * a[1] + ctm.f ];
  }
  
  return out;
}

function d3_geom_pointsEqual(p1, p2) {
  return abs(p1[0] - p2[0]) < ε && abs(p1[1] - p2[1]) < ε;
}

function d3_geom_polygonInside(p, a, b) {
  return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0]);
}

// Intersect two infinite lines cd and ab.
function d3_geom_polygonIntersect(c, d, a, b) {
  var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3,
      y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3,
      ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
  return [x1 + ua * x21, y1 + ua * y21];
}

// Returns true if the polygon is closed.
function d3_geom_polygonClosed(coordinates) {
  return d3_geom_pointsEqual(coordinates[0], coordinates[coordinates.length - 1]);
}
