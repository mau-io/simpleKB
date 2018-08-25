(function() {

  const PI = Math.PI;

  var colors = {
    background: "#171e26", //#016bc0
    lines:      "rgba(255, 255, 255, 0.2)",
    triangles:  "rgba(0, 196, 204, 0.2)",
    triangles2: "rgba(61, 125, 231, 0.2)",
    particle:   "rgba(255, 255, 255, 0.9)",
  }

  var config = {
    separation: 250,
    size:     600,
    quantity: 400,
    velocity: 2,
    distance: 100
  }
 

  window.onresize = function() {
    reset()
  }

  var canvas = document.getElementById("can");
  var c = canvas.getContext("2d");

  var cWidth
  var cHeight

  window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
  })();

  function magnitude(a, b) {
    return Math.sqrt(a*a + b*b);
  }
  function randPosNeg() {
    return (Math.random() > 0.5 ? 1 : -1);
  }

  var objIdCount = 0;

  function getObjId() {
    return objIdCount++;
  }

  function Particle(params) {
    params = params || {};
    this.id = getObjId();

    this.rr = Math.random() * config.size + config.separation;
    var a = Math.random()*360;

    this.x = cWidth/2 + this.rr*Math.cos(a*PI/180);
    this.y = cHeight/2 + this.rr*Math.sin(a*PI/180);

    var dx = this.x - cWidth/2;
    var dy = this.y - cHeight/2;
    var vm = magnitude(dx,dy);

    this.velocity = (Math.random()*2 + config.velocity);
    this.direction = params.direction || randPosNeg();
    this.vx = this.direction * this.velocity * dy/vm;
    this.vy = this.direction * this.velocity * -dx/vm;

    this.connectionCount = 0;

    this.radius = params.radius == undefined ? Math.floor(Math.random()*2)+1 : params.radius;
  }

  Particle.prototype.update = function(dt) {
    var dps = this.rr*2*PI / this.velocity;
    var a = (360/dps)*dt/1000 * -this.direction;

    this.vx = this.vx*Math.cos(a*PI/180) - this.vy*Math.sin(a*PI/180);
    this.vy = this.vx*Math.sin(a*PI/180) + this.vy*Math.cos(a*PI/180);

    var mag = magnitude(this.vx, this.vy);
      this.vx = this.vx/mag * this.velocity;
      this.vy = this.vy/mag * this.velocity;

      this.x += this.vx * dt / 1000;
      this.y += this.vy * dt / 1000;
  }

  Particle.prototype.draw = function() {
    c.save();

    c.beginPath();
    c.fillStyle = colors.particle;
    c.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    c.fill();

    c.restore();
  }
  
  Particle.prototype.clearConnections = function() {
    this.connections = {};
    this.connectionCount = 0;
  }
  
  Particle.prototype.addConnection = function(p) {
    this.connections[p.id] = true;
    this.connectionCount++;
  }
  
  Particle.prototype.checkIfConnectedTo = function(p) {
    return this.connections[p.id] != undefined ? true : false;
  }

  function lines() {
    c.save();
    c.strokeStyle = colors.lines;
    c.lineWidth = 0.5;

    for (var i = 0; i < particles.length; i++) {
      particles[i].clearConnections();
    }

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      for (var j = 0; j < particles.length; j++) {
        var p2 = particles[j];
        var dist = Math.sqrt(Math.pow(p.x-p2.x,2) + Math.pow(p.y-p2.y,2));

        if (dist < config.distance && !p.checkIfConnectedTo(p2)
           && p2.connectionCount <= 3 && p.connectionCount <= 3
           ) {
          c.beginPath();
          c.moveTo(p.x,p.y);
          c.lineTo(p2.x,p2.y);
          c.stroke();

          p.addConnection(p2);
          p2.addConnection(p);
        }
      }
    }
    c.restore();
  }

  function triangles() {
    c.save();
    c.strokeStyle = "#466070";
    c.lineWidth = 0.5;

    for (var i = 0; i < particles.length; i++) {
      particles[i].clearConnections();
    }

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var c1 = undefined, c2 = undefined, c3 = undefined;
      for (var j = 0; j < particles.length; j++) {
        var p2 = particles[j];
        var dist = Math.sqrt(Math.pow(p.x-p2.x,2) + Math.pow(p.y-p2.y,2));
        var newC = {dist: dist, p: p2};

        if (!p.checkIfConnectedTo(p2)) {
          if (c1 == undefined || c1.dist > dist) {
            c3 = c2;
            c2 = c1;
            c1 = newC;
          } else if (c2 == undefined || c2.dist > dist) {
            c3 = c2;
            c2 = newC;
          } else if (c3 == undefined || c3.dist > dist) {
            c3 = newC;
          }
        }
      }

      //console.log(c1.p.id, c2.p.id, c3.p.id);

      if (c1 !== undefined && c2 !== undefined && c3 !== undefined) {
        p.addConnection(c1.p);
        p.addConnection(c2.p);
        p.addConnection(c3.p);
        c1.p.addConnection(p);
        c2.p.addConnection(p);
        c3.p.addConnection(p);

        c.beginPath();
        c.moveTo(c1.p.x,c1.p.y);
        c.lineTo(c2.p.x,c2.p.y);
        c.lineTo(c3.p.x,c3.p.y);
        c.closePath();

        if(i % 2 == 0){
          c.fillStyle = colors.triangles;
        }else{
          c.fillStyle = colors.triangles2;
        }
        
        c.fill();
        //c.stroke();
      }
    }
    c.restore();
  }

  var objects = [];
  var particles = [];
 
  function reset() {
    canvas.width = window.innerWidth;
    canvas.height = 320;

    cWidth = canvas.width;
    cHeight = canvas.height;

    objects = [];
    particles = [];
    for (var i = 0; i < config.quantity; i++) {
      var p = new Particle();
      particles.push(p);
      objects.push(p);
    }
  }

  var ldt;
  var dt;

  function animate() {
    dt = new Date() - ldt;

    if (dt < 500) {
      // clear background
      c.fillStyle = colors.background;
      c.fillRect(0,0,cWidth,cHeight);

      lines();
      triangles();

      for (var i = 0; i < objects.length; i++) {
        var object = objects[i];
        object.update(dt);
        object.draw();
      }
    }

    ldt = new Date();
    setTimeout(function() {
      window.requestAnimFrame(animate);
    }, 1000/30);
  }
  
  ldt = new Date();

  reset();
  animate();
})();
