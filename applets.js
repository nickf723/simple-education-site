(function(){
  function ready(fn){
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  ready(function(){
    initRiemann();
    initSlope();
    window.addEventListener('resize', function(){
      // Redraw on resize to keep canvases responsive
      initRiemann(true);
      initSlope(true);
    });
  });

  // ===== Riemann Sum (x^2 on [0,1]) =====
  function initRiemann(isResize){
    var container = document.getElementById('applet-riemann');
    if(!container) return;
    if(!isResize){
      container.innerHTML = '';
      var controls = document.createElement('div'); controls.className = 'applet-controls';
      controls.innerHTML = ''+
        '<label>N rectangles: <input type="range" id="riemann-n" min="2" max="200" value="8" /> <span id="riemann-n-val">8</span></label> '+
        '<label style="margin-left:12px;">Method: '+
        '<select id="riemann-method"><option value="left">Left</option><option value="mid" selected>Midpoint</option><option value="right">Right</option></select>'+
        '</label> '+
        '<span id="riemann-sum" style="margin-left:12px;"></span>';
      container.appendChild(controls);
      var canvas = document.createElement('canvas');
      canvas.id = 'riemann-canvas';
      canvas.style.width = '100%';
      canvas.style.maxWidth = '700px';
      canvas.classList.add('applet-frame');
      container.appendChild(canvas);
    }
    var canvas = document.getElementById('riemann-canvas');
    if(!canvas) return;
    // Set actual pixel size
    var rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(420, Math.floor(rect.width));
    canvas.height = 280;

    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;

    function f(x){ return x*x; }

    // axes margins
    var L=50, R=20, T=20, B=40;
    var plotW = W - L - R;
    var plotH = H - T - B;

    // draw bg
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0,0,W,H);

    // axes
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    // x-axis
    ctx.beginPath();
    ctx.moveTo(L, H-B);
    ctx.lineTo(W-R, H-B);
    ctx.stroke();
    // y-axis
    ctx.beginPath();
    ctx.moveTo(L, T);
    ctx.lineTo(L, H-B);
    ctx.stroke();

    // ticks and labels
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '12px Inter, sans-serif';
    for(var i=0;i<=5;i++){
      var x=i/5; // 0..1
      var px=L + x*plotW;
      ctx.beginPath(); ctx.moveTo(px, H-B); ctx.lineTo(px, H-B+5); ctx.stroke();
      ctx.fillText(x.toFixed(1), px-6, H-B+18);
    }
    for(var j=0;j<=5;j++){
      var y=j/5; // 0..1
      var py=H-B - y*plotH; 
      ctx.beginPath(); ctx.moveTo(L-5, py); ctx.lineTo(L, py); ctx.stroke();
      ctx.fillText(y.toFixed(1), L-28, py+4);
    }

    // plot f(x)=x^2
    ctx.strokeStyle = '#c700a6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(var k=0;k<=200;k++){
      var xk = k/200;
      var yk = f(xk);
      var pxk = L + xk*plotW;
      var pyk = H-B - yk*plotH;
      if(k===0) ctx.moveTo(pxk,pyk); else ctx.lineTo(pxk,pyk);
    }
    ctx.stroke();

    // rectangles
    var n = parseInt(document.getElementById('riemann-n')?.value || 8,10);
    var method = document.getElementById('riemann-method')?.value || 'mid';
    var dx = 1/n, sum=0;
    ctx.fillStyle = 'rgba(199,0,166,0.2)';
    ctx.strokeStyle = 'rgba(199,0,166,0.6)';
    for(var r=0;r<n;r++){
      var x0 = r*dx;
      var xSample = (method==='left')? x0 : (method==='right')? (x0+dx) : (x0+dx/2);
      var h = f(xSample);
      sum += h*dx;
      var rx = L + x0*plotW;
      var rw = dx*plotW;
      var rh = h*plotH;
      var ry = H-B - rh;
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.fill();
      ctx.stroke();
    }

    var sumEl = document.getElementById('riemann-sum');
    if(sumEl){ sumEl.textContent = 'Estimate: ' + sum.toFixed(5); }

    // hook controls
    if(!isResize){
      var nInput = document.getElementById('riemann-n');
      var nVal = document.getElementById('riemann-n-val');
      var methodSel = document.getElementById('riemann-method');
      function update(){ nVal.textContent = nInput.value; initRiemann(false); }
      nInput.addEventListener('input', update);
      methodSel.addEventListener('change', update);
    }
  }

  // ===== Slope Tool =====
  function initSlope(isResize){
    var container = document.getElementById('applet-slope');
    if(!container) return;
    if(!isResize){
      container.innerHTML = '';
      var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('id','slope-svg');
      svg.style.width = '100%';
      svg.style.maxWidth = '700px';
      svg.setAttribute('height','320');
      svg.classList.add('applet-frame');
      container.appendChild(svg);
      var info = document.createElement('div');
      info.id='slope-info';
      info.style.marginTop = '8px';
      container.appendChild(info);
    }
    var svgEl = document.getElementById('slope-svg');
    if(!svgEl) return;

    // size
    var rect = svgEl.getBoundingClientRect();
    var W = Math.max(420, Math.floor(rect.width));
    var H = 320;
    svgEl.setAttribute('width', W);
    svgEl.setAttribute('height', H);

    var margin = {L:40,R:20,T:20,B:30};
    var plotW = W - margin.L - margin.R;
    var plotH = H - margin.T - margin.B;

    // clear
    while(svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

    // helpers
    function sx(x){ return margin.L + (x+10)/20*plotW; } // map x in [-10,10]
    function sy(y){ return margin.T + (10-y)/20*plotH; } // map y in [-10,10]

    // grid
    var grid = document.createElementNS('http://www.w3.org/2000/svg','g');
    grid.setAttribute('stroke','rgba(255,255,255,0.15)');
    grid.setAttribute('stroke-width','1');
    for(var i=-10;i<=10;i++){
      var gx = sx(i);
      var gy = sy(i);
      var v = document.createElementNS('http://www.w3.org/2000/svg','line');
      v.setAttribute('x1', gx); v.setAttribute('y1', sy(-10));
      v.setAttribute('x2', gx); v.setAttribute('y2', sy(10));
      grid.appendChild(v);
      var h = document.createElementNS('http://www.w3.org/2000/svg','line');
      h.setAttribute('x1', sx(-10)); h.setAttribute('y1', gy);
      h.setAttribute('x2', sx(10)); h.setAttribute('y2', gy);
      grid.appendChild(h);
    }
    svgEl.appendChild(grid);

    // axes
    var axes = document.createElementNS('http://www.w3.org/2000/svg','g');
    axes.setAttribute('stroke','rgba(255,255,255,0.6)');
    axes.setAttribute('stroke-width','2');
    var xAxis = document.createElementNS('http://www.w3.org/2000/svg','line');
    xAxis.setAttribute('x1', sx(-10)); xAxis.setAttribute('y1', sy(0));
    xAxis.setAttribute('x2', sx(10)); xAxis.setAttribute('y2', sy(0));
    axes.appendChild(xAxis);
    var yAxis = document.createElementNS('http://www.w3.org/2000/svg','line');
    yAxis.setAttribute('x1', sx(0)); yAxis.setAttribute('y1', sy(-10));
    yAxis.setAttribute('x2', sx(0)); yAxis.setAttribute('y2', sy(10));
    axes.appendChild(yAxis);
    svgEl.appendChild(axes);

    // initial points
    var A = {x:-4, y:-1};
    var B = {x:5, y:3};

    // line element
    var lineEl = document.createElementNS('http://www.w3.org/2000/svg','line');
    lineEl.setAttribute('stroke','#c700a6');
    lineEl.setAttribute('stroke-width','2');
    svgEl.appendChild(lineEl);

    // point elements
    function makePoint(color){
      var g = document.createElementNS('http://www.w3.org/2000/svg','g');
      var c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('r','6'); c.setAttribute('fill',color); c.setAttribute('stroke','white'); c.setAttribute('stroke-width','1.5');
      g.appendChild(c);
      g.style.cursor = 'grab';
      svgEl.appendChild(g);
      return {g:g, c:c};
    }
    var Ap = makePoint('#00b3ff');
    var Bp = makePoint('#ffb300');

    function update(){
      // Update line across full width
      var dx = (B.x - A.x), dy = (B.y - A.y);
      var info = document.getElementById('slope-info');
      if(Math.abs(dx) < 1e-9){
        lineEl.setAttribute('x1', sx(A.x)); lineEl.setAttribute('y1', sy(-10));
        lineEl.setAttribute('x2', sx(A.x)); lineEl.setAttribute('y2', sy(10));
        Ap.g.setAttribute('transform', 'translate('+sx(A.x)+','+sy(A.y)+')');
        Bp.g.setAttribute('transform', 'translate('+sx(B.x)+','+sy(B.y)+')');
        info.textContent = 'Slope: undefined (vertical). Equation: x = ' + A.x.toFixed(2);
        return;
      }
      var m = dy/dx;
      var b = A.y - m*A.x;
      // find intersections with box x in [-10,10]
      var x1=-10, x2=10;
      var y1=m*x1+b, y2=m*x2+b;
      lineEl.setAttribute('x1', sx(x1)); lineEl.setAttribute('y1', sy(y1));
      lineEl.setAttribute('x2', sx(x2)); lineEl.setAttribute('y2', sy(y2));
      Ap.g.setAttribute('transform', 'translate('+sx(A.x)+','+sy(A.y)+')');
      Bp.g.setAttribute('transform', 'translate('+sx(B.x)+','+sy(B.y)+')');
      var mStr = m.toFixed(3);
      var bStr = b.toFixed(3);
      info.textContent = 'Slope: '+mStr+'; Equation: y = '+mStr+'x + '+bStr;
    }

    function enableDrag(pt){
      var dragging=false;
      var offset={x:0,y:0};
      pt.g.addEventListener('mousedown', function(e){ dragging=true; pt.g.style.cursor='grabbing'; });
      document.addEventListener('mouseup', function(){ dragging=false; pt.g.style.cursor='grab'; });
      svgEl.addEventListener('mousemove', function(e){
        if(!dragging) return;
        var bb = svgEl.getBoundingClientRect();
        var px = e.clientX - bb.left; var py = e.clientY - bb.top;
        // invert to coords
        var x = (px - margin.L)/plotW*20 - 10;
        var y = 10 - (py - margin.T)/plotH*20;
        // clamp
        x = Math.max(-10, Math.min(10, x));
        y = Math.max(-10, Math.min(10, y));
        if(pt===Ap) { A.x=x; A.y=y; } else { B.x=x; B.y=y; }
        update();
      });
    }

    enableDrag(Ap); enableDrag(Bp);
    update();
  }
})();

// ===== Tangent Slider (Calculus) =====
(function(){
  function ready(fn){ if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded', fn);} else { fn(); } }
  ready(function(){ initTangent(); initAngle(); initInequality(); window.addEventListener('resize', function(){ initTangent(true); initAngle(true); initInequality(true); }); });

  function initTangent(isResize){
    var container = document.getElementById('applet-tangent');
    if(!container) return;
    if(!isResize){
      container.innerHTML = '';
      var controls = document.createElement('div'); controls.className = 'applet-controls';
      controls.innerHTML = ''+
        '<label>f(x): <select id="tan-f"><option value="x2">x^2</option><option value="sin">sin x</option><option value="exp">e^x</option></select></label>'+
        '<label style="margin-left:12px;">x0: <input type="range" id="tan-x0" min="-3.14159" max="3.14159" step="0.01" value="0.5"/> <span id="tan-x0-val">0.50</span></label>'+
        '<span id="tan-slope" style="margin-left:12px;"></span>';
      container.appendChild(controls);
      var canvas = document.createElement('canvas'); canvas.id='tan-canvas'; canvas.style.width='100%'; canvas.style.maxWidth='700px';
      canvas.style.border='1px solid rgba(255,255,255,0.1)'; canvas.style.borderRadius='6px'; container.appendChild(canvas);
    }
    var canvas = document.getElementById('tan-canvas'); if(!canvas) return;
    var rect = canvas.getBoundingClientRect(); canvas.width=Math.max(420, Math.floor(rect.width)); canvas.height=280;
    var ctx = canvas.getContext('2d'); var W=canvas.width, H=canvas.height; var L=50,R=20,T=20,B=40; var plotW=W-L-R, plotH=H-T-B;

    var fSel = document.getElementById('tan-f'); var x0in = document.getElementById('tan-x0'); var x0val = document.getElementById('tan-x0-val');
    var fType = fSel ? fSel.value : 'x2'; var x0 = x0in ? parseFloat(x0in.value) : 0.5; if(x0val) x0val.textContent = x0.toFixed(2);

    function f(x){ if(fType==='x2') return 0.2*x*x; if(fType==='sin') return Math.sin(x); if(fType==='exp') return Math.exp(x)/10; return x; }
    function df(x){ if(fType==='x2') return 0.4*x; if(fType==='sin') return Math.cos(x); if(fType==='exp') return Math.exp(x)/10; return 1; }

    // determine y range from samples
    var ymin=Infinity, ymax=-Infinity; for(var k=0;k<=200;k++){ var xx = -Math.PI + (2*Math.PI)*k/200; var yy = f(xx); ymin=Math.min(ymin,yy); ymax=Math.max(ymax,yy); }
    if(!isFinite(ymin)||!isFinite(ymax) || ymin===ymax){ ymin=-2; ymax=2; }
    // add padding
    var pad=(ymax-ymin)*0.15; ymin-=pad; ymax+=pad;

    function sx(x){ return L + (x + Math.PI)/(2*Math.PI)*plotW; }
    function sy(y){ return H-B - (y - ymin)/(ymax - ymin)*plotH; }

    // bg + axes
    ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(L,H-B); ctx.lineTo(W-R,H-B); ctx.stroke(); ctx.beginPath(); ctx.moveTo(L,T); ctx.lineTo(L,H-B); ctx.stroke();

    // function graph
    ctx.strokeStyle = '#c700a6'; ctx.lineWidth=2; ctx.beginPath(); for(var i=0;i<=400;i++){ var x=-Math.PI + (2*Math.PI)*i/400; var y=f(x); var px=sx(x), py=sy(y); if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);} ctx.stroke();

    // point + tangent
    var y0=f(x0), m=df(x0), b=y0 - m*x0; // y = m x + b
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(sx(x0), sy(y0), 4, 0, 2*Math.PI); ctx.fill();
    // draw tangent line across full x-range
    var xL=-Math.PI, xR=Math.PI; var yL=m*xL+b, yR=m*xR+b; ctx.strokeStyle='#00b3ff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(sx(xL),sy(yL)); ctx.lineTo(sx(xR),sy(yR)); ctx.stroke();

    var slopeEl = document.getElementById('tan-slope'); if(slopeEl){ slopeEl.textContent = 'Slope at x0: ' + m.toFixed(4) + '  |  f(x0)=' + y0.toFixed(4); }

    if(!isResize){
      fSel.addEventListener('change', function(){ initTangent(false); });
      x0in.addEventListener('input', function(){ initTangent(false); });
    }
  }

  // ===== Angle Explorer (Geometry) =====
  function initAngle(isResize){
    var container = document.getElementById('applet-angle'); if(!container) return;
    if(!isResize){
      container.innerHTML='';
      var svg = document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('id','angle-svg'); svg.style.width='100%'; svg.style.maxWidth='700px'; svg.setAttribute('height','320'); svg.style.border='1px solid rgba(255,255,255,0.1)'; svg.style.borderRadius='6px'; container.appendChild(svg);
      var info=document.createElement('div'); info.id='angle-info'; info.style.marginTop='8px'; container.appendChild(info);
    }
    var svgEl=document.getElementById('angle-svg'); if(!svgEl) return;
    var rect=svgEl.getBoundingClientRect(); var W=Math.max(420, Math.floor(rect.width)), H=320; svgEl.setAttribute('width',W); svgEl.setAttribute('height',H);
    while(svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
    var cx=W/2, cy=H/2;

    // circle guide
    var circle=document.createElementNS('http://www.w3.org/2000/svg','circle'); circle.setAttribute('cx',cx); circle.setAttribute('cy',cy); circle.setAttribute('r',110); circle.setAttribute('fill','none'); circle.setAttribute('stroke','rgba(255,255,255,0.15)'); svgEl.appendChild(circle);

    // rays endpoints
    var A={x:cx+100, y:cy}, B={x:cx, y:cy-100};

    function angleDeg(){ var v1={x:A.x-cx,y:A.y-cy}, v2={x:B.x-cx,y:B.y-cy}; var dot=v1.x*v2.x+v1.y*v2.y; var n1=Math.hypot(v1.x,v1.y), n2=Math.hypot(v2.x,v2.y); var t=Math.acos(Math.min(1,Math.max(-1,dot/(n1*n2)))); return t*180/Math.PI; }

    function draw(){
      while(svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
      svgEl.appendChild(circle);
      var g=document.createElementNS('http://www.w3.org/2000/svg','g'); g.setAttribute('stroke','#c700a6'); g.setAttribute('stroke-width','3');
      var r1=document.createElementNS('http://www.w3.org/2000/svg','line'); r1.setAttribute('x1',cx); r1.setAttribute('y1',cy); r1.setAttribute('x2',A.x); r1.setAttribute('y2',A.y); g.appendChild(r1);
      var r2=document.createElementNS('http://www.w3.org/2000/svg','line'); r2.setAttribute('x1',cx); r2.setAttribute('y1',cy); r2.setAttribute('x2',B.x); r2.setAttribute('y2',B.y); g.appendChild(r2);
      svgEl.appendChild(g);
      var arc=document.createElementNS('http://www.w3.org/2000/svg','path'); arc.setAttribute('fill','rgba(199,0,166,0.18)'); arc.setAttribute('stroke','rgba(199,0,166,0.6)'); arc.setAttribute('stroke-width','2');
      function angOf(P){ return Math.atan2(P.y-cy, P.x-cx); }
      var t1=angOf(A), t2=angOf(B); var largeArc = Math.abs(t2-t1) > Math.PI ? 1 : 0;
      var R=60; var x1=cx+R*Math.cos(t1), y1=cy+R*Math.sin(t1); var x2=cx+R*Math.cos(t2), y2=cy+R*Math.sin(t2);
      var sweep=(t2-t1)>=0?1:0; arc.setAttribute('d', 'M '+cx+','+cy+' L '+x1+','+y1+' A '+R+','+R+' 0 '+largeArc+' '+sweep+' '+x2+','+y2+' Z'); svgEl.appendChild(arc);
      // draggable handles
      function makeHandle(P,color){ var h=document.createElementNS('http://www.w3.org/2000/svg','circle'); h.setAttribute('cx',P.x); h.setAttribute('cy',P.y); h.setAttribute('r','7'); h.setAttribute('fill',color); h.setAttribute('stroke','white'); h.setAttribute('stroke-width','1.5'); svgEl.appendChild(h); return h; }
      var hA=makeHandle(A,'#00b3ff'); var hB=makeHandle(B,'#ffb300');
      var info=document.getElementById('angle-info'); var ang=angleDeg(); info.textContent = 'Angle: '+ang.toFixed(1)+'° — '+(ang<90?'Acute':ang===90?'Right':ang<180?'Obtuse':ang===180?'Straight':'Reflex');
      function drag(handle,P){ var dragging=false; handle.addEventListener('mousedown', function(){ dragging=true; }); document.addEventListener('mouseup', function(){ dragging=false; }); svgEl.addEventListener('mousemove', function(e){ if(!dragging) return; var bb=svgEl.getBoundingClientRect(); var x=e.clientX-bb.left, y=e.clientY-bb.top; var dx=x-cx, dy=y-cy; var s=Math.hypot(dx,dy); var R=100; P.x=cx+dx/s*R; P.y=cy+dy/s*R; draw(); }); }
      drag(hA,A); drag(hB,B);
    }
    draw();
  }

  // ===== Inequality Line (Algebra) =====
  function initInequality(isResize){
    var container = document.getElementById('applet-inequality'); if(!container) return;
    if(!isResize){
      container.innerHTML='';
      var controls = document.createElement('div'); controls.style.margin='10px 0';
      controls.innerHTML = '<label>Type: <select id="ineq-type"><option value="lt">x &lt; a</option><option value="le">x \u2264 a</option><option value="gt">x &gt; a</option><option value="ge">x \u2265 a</option></select></label>'+
        '<label style="margin-left:12px;">a: <input type="range" id="ineq-a" min="-10" max="10" step="0.1" value="0"/> <span id="ineq-a-val">0.0</span></label>';
      container.appendChild(controls);
      var canvas=document.createElement('canvas'); canvas.id='ineq-canvas'; canvas.style.width='100%'; canvas.style.maxWidth='700px'; canvas.style.border='1px solid rgba(255,255,255,0.1)'; canvas.style.borderRadius='6px'; container.appendChild(canvas);
    }
    var canvas=document.getElementById('ineq-canvas'); if(!canvas) return; var rect=canvas.getBoundingClientRect(); canvas.width=Math.max(420, Math.floor(rect.width)); canvas.height=140;
    var ctx=canvas.getContext('2d'); var W=canvas.width, H=canvas.height; var L=40,R=20, mid=H/2;
    var tSel=document.getElementById('ineq-type'); var aIn=document.getElementById('ineq-a'); var aVal=document.getElementById('ineq-a-val'); var type=tSel?tSel.value:'lt'; var a=aIn?parseFloat(aIn.value):0; if(aVal)aVal.textContent=a.toFixed(1);

    function sx(x){ return L + (x+10)/20 * (W-L-R); }
    function ix(px){ return (px-L)/(W-L-R)*20 - 10; }

    // bg
    ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(0,0,W,H);
    // number line
    ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(L,mid); ctx.lineTo(W-R,mid); ctx.stroke();
    // ticks
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1; ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font='12px Inter, sans-serif';
    for(var i=-10;i<=10;i++){
      var px=sx(i); ctx.beginPath(); ctx.moveTo(px,mid-6); ctx.lineTo(px,mid+6); ctx.stroke(); if(i%2===0){ ctx.fillText(i.toString(), px-6, mid+20); }
    }
    // boundary
    var pa=sx(a); ctx.lineWidth=2; ctx.strokeStyle='#c700a6';
    ctx.beginPath(); ctx.moveTo(pa, mid-12); ctx.lineTo(pa, mid+12); ctx.stroke();
    // circle
    ctx.beginPath(); ctx.arc(pa, mid, 7, 0, Math.PI*2);
    var closed = (type==='le' || type==='ge'); ctx.fillStyle = closed ? '#c700a6' : 'transparent'; ctx.strokeStyle='#c700a6'; ctx.lineWidth=2; if(closed) ctx.fill(); ctx.stroke();
    // region
    ctx.fillStyle='rgba(199,0,166,0.2)';
    if(type==='lt' || type==='le'){ ctx.fillRect(L, mid-10, pa-L, 20); }
    if(type==='gt' || type==='ge'){ ctx.fillRect(pa, mid-10, (W-R)-pa, 20); }
    // arrow indicators
    ctx.strokeStyle='rgba(199,0,166,0.7)'; ctx.lineWidth=2; if(type==='lt'||type==='le'){ ctx.beginPath(); ctx.moveTo(L,mid); ctx.lineTo(L+14, mid-6); ctx.moveTo(L,mid); ctx.lineTo(L+14, mid+6); ctx.stroke(); } else { ctx.beginPath(); ctx.moveTo(W-R,mid); ctx.lineTo(W-R-14, mid-6); ctx.moveTo(W-R,mid); ctx.lineTo(W-R-14, mid+6); ctx.stroke(); }

    if(!isResize){
      tSel.addEventListener('change', function(){ initInequality(false); });
      aIn.addEventListener('input', function(){ initInequality(false); });
    }
  }
})();



// ===== Unit Circle Explorer (Trigonometry) =====
(function(){
  function ready(fn){ if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded', fn);} else { fn(); } }
  ready(function(){ initUnitCircle(); window.addEventListener('resize', function(){ initUnitCircle(true); }); });

  function initUnitCircle(isResize){
    var container = document.getElementById('applet-unit-circle');
    if(!container) return;
    if(!isResize){
      container.innerHTML = '';
      var controls = document.createElement('div'); controls.className = 'applet-controls';
      controls.innerHTML = ''+
        '<label>Angle (rad): <input type="range" id="uc-theta" min="-'+Math.PI.toFixed(5)+'" max="'+Math.PI.toFixed(5)+'" step="0.005" value="0.785"/> <span id="uc-theta-val">0.785</span></label>'+
        '<label><input type="checkbox" id="uc-deg"/> show degrees</label>'+
        '<span id="uc-coords"></span>';
      container.appendChild(controls);
      var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('id','uc-svg'); svg.style.width='100%'; svg.classList.add('applet-frame'); svg.setAttribute('height','360');
      container.appendChild(svg);
    }
    var svgEl = document.getElementById('uc-svg'); if(!svgEl) return;
    var rect = svgEl.getBoundingClientRect(); var W = Math.max(420, Math.floor(rect.width)); var H = 360; svgEl.setAttribute('width', W); svgEl.setAttribute('height', H);
    while(svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

    var L=40,R=20,T=20,B=40; var cx = (W-L-R)/2 + L; var cy = (H-T-B)/2 + T; var R0 = Math.min(W-L-R, H-T-B)/2 - 10;

    var thetaInput = document.getElementById('uc-theta'); var thetaVal = document.getElementById('uc-theta-val'); var showDeg = document.getElementById('uc-deg');
    var theta = thetaInput ? parseFloat(thetaInput.value) : Math.PI/4; if(thetaVal) thetaVal.textContent = theta.toFixed(3);

    // Axes
    function line(x1,y1,x2,y2,sty){ var el=document.createElementNS('http://www.w3.org/2000/svg','line'); el.setAttribute('x1',x1); el.setAttribute('y1',y1); el.setAttribute('x2',x2); el.setAttribute('y2',y2); if(sty){ for(var k in sty){ el.setAttribute(k, sty[k]); } } svgEl.appendChild(el); return el; }
    function circle(cx_,cy_,r,sty){ var el=document.createElementNS('http://www.w3.org/2000/svg','circle'); el.setAttribute('cx',cx_); el.setAttribute('cy',cy_); el.setAttribute('r',r); if(sty){ for(var k in sty){ el.setAttribute(k, sty[k]); } } svgEl.appendChild(el); return el; }
    function text(x,y,txt,sty){ var el=document.createElementNS('http://www.w3.org/2000/svg','text'); el.setAttribute('x',x); el.setAttribute('y',y); el.textContent = txt; if(sty){ for(var k in sty){ el.setAttribute(k, sty[k]); } } svgEl.appendChild(el); return el; }

    // grid faint
    var grid = document.createElementNS('http://www.w3.org/2000/svg','g'); grid.setAttribute('stroke','rgba(255,255,255,0.15)'); grid.setAttribute('stroke-width','1');
    for(var i=-3;i<=3;i++){
      var gx = cx + i*R0/3; var gy = cy + i*R0/3;
      var v=document.createElementNS('http://www.w3.org/2000/svg','line'); v.setAttribute('x1',gx); v.setAttribute('y1',cy-R0); v.setAttribute('x2',gx); v.setAttribute('y2',cy+R0); grid.appendChild(v);
      var h=document.createElementNS('http://www.w3.org/2000/svg','line'); h.setAttribute('x1',cx-R0); h.setAttribute('y1',gy); h.setAttribute('x2',cx+R0); h.setAttribute('y2',gy); grid.appendChild(h);
    }
    svgEl.appendChild(grid);

    // axes bold
    line(cx-R0, cy, cx+R0, cy, {stroke:'rgba(255,255,255,0.6)', 'stroke-width':'2'});
    line(cx, cy-R0, cx, cy+R0, {stroke:'rgba(255,255,255,0.6)', 'stroke-width':'2'});

    // unit circle
    circle(cx, cy, R0, {fill:'none', stroke:'rgba(255,255,255,0.35)', 'stroke-width':'2'});

    // point on circle
    var x = Math.cos(theta), y = Math.sin(theta);
    var px = cx + R0*x, py = cy - R0*y;

    // radius line
    line(cx, cy, px, py, {stroke:'#c700a6', 'stroke-width':'3'});

    // projections
    line(px, cy, px, py, {stroke:'rgba(199,0,166,0.6)', 'stroke-dasharray':'4 4'});
    line(cx, py, px, py, {stroke:'rgba(199,0,166,0.6)', 'stroke-dasharray':'4 4'});

    // point
    circle(px, py, 6, {fill:'#00b3ff', stroke:'#fff', 'stroke-width':'1.5'});

    // angle arc
    var arcR = R0*0.35; var ax1 = cx + arcR*Math.cos(0), ay1 = cy - arcR*Math.sin(0);
    var ax2 = cx + arcR*Math.cos(theta), ay2 = cy - arcR*Math.sin(theta);
    var large = Math.abs(theta) > Math.PI ? 1 : 0; var sweep = theta>=0 ? 0 : 1; // y inverted
    var arc = document.createElementNS('http://www.w3.org/2000/svg','path');
    arc.setAttribute('d', 'M '+cx+','+cy+' L '+ax1+','+ay1+' A '+arcR+','+arcR+' 0 '+large+' '+sweep+' '+ax2+','+ay2);
    arc.setAttribute('fill','none'); arc.setAttribute('stroke','#00b3ff'); arc.setAttribute('stroke-width','2'); svgEl.appendChild(arc);

    // labels
    text(cx+8, cy-8, '0', {fill:'rgba(255,255,255,0.7)', 'font-size':'12'});
    text(cx+R0+6, cy+14, 'x', {fill:'rgba(255,255,255,0.7)'});
    text(cx-10, cy-R0-6, 'y', {fill:'rgba(255,255,255,0.7)'});

    var deg = showDeg && showDeg.checked; var angLabel = deg ? (theta*180/Math.PI).toFixed(1)+'°' : theta.toFixed(3)+' rad';
    text(cx + (arcR+10)*Math.cos(theta/2), cy - (arcR+10)*Math.sin(theta/2), angLabel, {fill:'#00b3ff'});

    var coordsEl = document.getElementById('uc-coords'); if(coordsEl){ coordsEl.textContent = '(cos θ, sin θ) = ('+x.toFixed(3)+', '+y.toFixed(3)+')'; }

    // Dragging behavior
    var dragging=false;
    svgEl.addEventListener('mousedown', function(e){
      var bb=svgEl.getBoundingClientRect(); var mx=e.clientX-bb.left, my=e.clientY-bb.top; var dx=mx-cx, dy=my-cy; var dist=Math.hypot(dx,dy);
      if(Math.abs(dist-R0) < 18 || Math.hypot(mx-px,my-py) < 14){ dragging=true; }
    });
    document.addEventListener('mouseup', function(){ dragging=false; });
    svgEl.addEventListener('mousemove', function(e){ if(!dragging) return; var bb=svgEl.getBoundingClientRect(); var mx=e.clientX-bb.left, my=e.clientY-bb.top; var dx=mx-cx, dy=my-cy; var ang=Math.atan2(-dy, dx); if(thetaInput){ thetaInput.value = ang.toFixed(3); } initUnitCircle(false); });

    if(!isResize){
      thetaInput.addEventListener('input', function(){ initUnitCircle(false); });
      if(showDeg){ showDeg.addEventListener('change', function(){ initUnitCircle(false); }); }
    }
  }
})();

// ===== Unit Circle Explorer (Trigonometry) =====
(function(){
  function ready(fn){ if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded', fn);} else { fn(); } }
  ready(function(){ initUnitCircle(); window.addEventListener('resize', function(){ initUnitCircle(true); }); });

  function initUnitCircle(isResize){
    var container = document.getElementById('applet-unit-circle');
    if(!container) return;
    if(!isResize){
      container.innerHTML = '';
      var controls = document.createElement('div'); controls.className = 'applet-controls';
      controls.innerHTML = ''+
        '<label>Angle (rad): <input type="range" id="uc-theta" min="-3.14159" max="3.14159" step="0.005" value="0.785"/> <span id="uc-theta-val">0.785</span></label>'+
        '<label><input type="checkbox" id="uc-deg"/> show degrees</label>'+
        '<span id="uc-coords"></span>';
      container.appendChild(controls);
      var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('id','uc-svg'); svg.style.width='100%'; svg.classList.add('applet-frame'); svg.setAttribute('height','360');
      container.appendChild(svg);
    }
    var svgEl = document.getElementById('uc-svg'); if(!svgEl) return;
    var rect = svgEl.getBoundingClientRect(); var W = Math.max(420, Math.floor(rect.width)); var H = 360; svgEl.setAttribute('width', W); svgEl.setAttribute('height', H);
    while(svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

    var L=40,R=20,T=20,B=40; var cx = (W-L-R)/2 + L; var cy = (H-T-B)/2 + T; var R0 = Math.min(W-L-R, H-T-B)/2 - 10;

    var thetaInput = document.getElementById('uc-theta'); var thetaVal = document.getElementById('uc-theta-val'); var showDeg = document.getElementById('uc-deg');
    var theta = thetaInput ? parseFloat(thetaInput.value) : Math.PI/4; if(thetaVal) thetaVal.textContent = theta.toFixed(3);

    function line(x1,y1,x2,y2,sty){ var el=document.createElementNS('http://www.w3.org/2000/svg','line'); el.setAttribute('x1',x1); el.setAttribute('y1',y1); el.setAttribute('x2',x2); el.setAttribute('y2',y2); if(sty){ for(var k in sty){ el.setAttribute(k, sty[k]); } } svgEl.appendChild(el); return el; }
    function circle(cx_,cy_,r,sty){ var el=document.createElementNS('http://www.w3.org/2000/svg','circle'); el.setAttribute('cx',cx_); el.setAttribute('cy',cy_); el.setAttribute('r',r); if(sty){ for(var k in sty){ el.setAttribute(k, sty[k]); } } svgEl.appendChild(el); return el; }
    function text(x,y,txt,sty){ var el=document.createElementNS('http://www.w3.org/2000/svg','text'); el.setAttribute('x',x); el.setAttribute('y',y); el.textContent = txt; if(sty){ for(var k in sty){ el.setAttribute(k, sty[k]); } } svgEl.appendChild(el); return el; }

    var grid = document.createElementNS('http://www.w3.org/2000/svg','g'); grid.setAttribute('stroke','rgba(255,255,255,0.15)'); grid.setAttribute('stroke-width','1');
    for(var i=-3;i<=3;i++){
      var gx = cx + i*R0/3; var gy = cy + i*R0/3;
      var v=document.createElementNS('http://www.w3.org/2000/svg','line'); v.setAttribute('x1',gx); v.setAttribute('y1',cy-R0); v.setAttribute('x2',gx); v.setAttribute('y2',cy+R0); grid.appendChild(v);
      var h=document.createElementNS('http://www.w3.org/2000/svg','line'); h.setAttribute('x1',cx-R0); h.setAttribute('y1',gy); h.setAttribute('x2',cx+R0); h.setAttribute('y2',gy); grid.appendChild(h);
    }
    svgEl.appendChild(grid);

    line(cx-R0, cy, cx+R0, cy, {stroke:'rgba(255,255,255,0.6)', 'stroke-width':'2'});
    line(cx, cy-R0, cx, cy+R0, {stroke:'rgba(255,255,255,0.6)', 'stroke-width':'2'});

    circle(cx, cy, R0, {fill:'none', stroke:'rgba(255,255,255,0.35)', 'stroke-width':'2'});

    var x = Math.cos(theta), y = Math.sin(theta);
    var px = cx + R0*x, py = cy - R0*y;

    line(cx, cy, px, py, {stroke:'#c700a6', 'stroke-width':'3'});

    line(px, cy, px, py, {stroke:'rgba(199,0,166,0.6)', 'stroke-dasharray':'4 4'});
    line(cx, py, px, py, {stroke:'rgba(199,0,166,0.6)', 'stroke-dasharray':'4 4'});

    circle(px, py, 6, {fill:'#00b3ff', stroke:'#fff', 'stroke-width':'1.5'});

    var arcR = R0*0.35; var ax1 = cx + arcR*Math.cos(0), ay1 = cy - arcR*Math.sin(0);
    var ax2 = cx + arcR*Math.cos(theta), ay2 = cy - arcR*Math.sin(theta);
    var large = Math.abs(theta) > Math.PI ? 1 : 0; var sweep = theta>=0 ? 0 : 1;
    var arc = document.createElementNS('http://www.w3.org/2000/svg','path');
    arc.setAttribute('d', 'M '+cx+','+cy+' L '+ax1+','+ay1+' A '+arcR+','+arcR+' 0 '+large+' '+sweep+' '+ax2+','+ay2);
    arc.setAttribute('fill','none'); arc.setAttribute('stroke','#00b3ff'); arc.setAttribute('stroke-width','2'); svgEl.appendChild(arc);

    text(cx+8, cy-8, '0', {fill:'rgba(255,255,255,0.7)', 'font-size':'12'});
    text(cx+R0+6, cy+14, 'x', {fill:'rgba(255,255,255,0.7)'});
    text(cx-10, cy-R0-6, 'y', {fill:'rgba(255,255,255,0.7)'});

    var deg = showDeg && showDeg.checked; var angLabel = deg ? (theta*180/Math.PI).toFixed(1)+'°' : theta.toFixed(3)+' rad';
    text(cx + (arcR+10)*Math.cos(theta/2), cy - (arcR+10)*Math.sin(theta/2), angLabel, {fill:'#00b3ff'});

    var coordsEl = document.getElementById('uc-coords'); if(coordsEl){ coordsEl.textContent = '(cos θ, sin θ) = ('+x.toFixed(3)+', '+y.toFixed(3)+')'; }

    var dragging=false;
    svgEl.addEventListener('mousedown', function(e){ var bb=svgEl.getBoundingClientRect(); var mx=e.clientX-bb.left, my=e.clientY-bb.top; var dx=mx-cx, dy=my-cy; var dist=Math.hypot(dx,dy); if(Math.abs(dist-R0) < 18 || Math.hypot(mx-px,my-py) < 14){ dragging=true; }});
    document.addEventListener('mouseup', function(){ dragging=false; });
    svgEl.addEventListener('mousemove', function(e){ if(!dragging) return; var bb=svgEl.getBoundingClientRect(); var mx=e.clientX-bb.left, my=e.clientY-bb.top; var dx=mx-cx, dy=my-cy; var ang=Math.atan2(-dy, dx); if(thetaInput){ thetaInput.value = ang.toFixed(3); } initUnitCircle(false); });

    if(!isResize){ thetaInput.addEventListener('input', function(){ initUnitCircle(false); }); if(showDeg){ showDeg.addEventListener('change', function(){ initUnitCircle(false); }); } }
  }
})();

// ===== Distribution Explorer (Stats) =====
(function(){
  function ready(fn){ if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded', fn);} else { fn(); } }
  ready(function(){ initDist(); window.addEventListener('resize', function(){ initDist(true); }); });

  function randn(){ // Box-Muller
    let u=0,v=0; while(u===0) u=Math.random(); while(v===0) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }

  function initDist(isResize){
    var container = document.getElementById('applet-dist-explorer'); if(!container) return;
    if(!isResize){
      container.innerHTML = '';
      var controls = document.createElement('div'); controls.className='applet-controls';
      controls.innerHTML = ''+
        '<label>Dist: <select id="dx-type"><option value="normal">Normal</option><option value="binom">Binomial</option><option value="poisson">Poisson</option></select></label>'+
        '<span id="dx-params"></span>'+
        '<label><input type="checkbox" id="dx-sim" checked/> show samples</label>'+
        '<label>n: <input type="range" id="dx-n" min="10" max="2000" step="10" value="400"/> <span id="dx-n-val">400</span></label>'+
        '<span id="dx-info"></span>';
      container.appendChild(controls);
      var canvas = document.createElement('canvas'); canvas.id='dx-canvas'; canvas.style.width='100%'; canvas.classList.add('applet-frame'); canvas.height=300; container.appendChild(canvas);
    }
    var canvas=document.getElementById('dx-canvas'); if(!canvas) return; var rect=canvas.getBoundingClientRect(); canvas.width=Math.max(420, Math.floor(rect.width));
    var ctx=canvas.getContext('2d'); var W=canvas.width, H=canvas.height; var L=50,R=20,T=20,B=40; var plotW=W-L-R, plotH=H-T-B;

    var typeSel=document.getElementById('dx-type'); var simChk=document.getElementById('dx-sim'); var nIn=document.getElementById('dx-n'); var nVal=document.getElementById('dx-n-val'); nVal.textContent=nIn.value;
    var type = typeSel.value;

    // Build param controls
    var pSpan=document.getElementById('dx-params');
    function paramsHTML(){
      if(type==='normal') return ' <label>μ: <input type="number" step="0.1" id="dx-mu" value="0" style="width:70px"></label> <label>σ: <input type="number" step="0.1" id="dx-sig" value="1" style="width:70px"></label>';
      if(type==='binom') return ' <label>n: <input type="number" id="dx-bn" value="10" style="width:70px"></label> <label>p: <input type="number" step="0.01" id="dx-bp" value="0.5" style="width:70px"></label>';
      return ' <label>λ: <input type="number" step="0.1" id="dx-lam" value="4" style="width:70px"></label>';
    }
    pSpan.innerHTML = paramsHTML();

    // Helpers for axes
    ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(L,H-B); ctx.lineTo(W-R,H-B); ctx.stroke(); ctx.beginPath(); ctx.moveTo(L,T); ctx.lineTo(L,H-B); ctx.stroke();

    function drawNormal(mu,sig){
      // theoretical curve
      ctx.strokeStyle='#c700a6'; ctx.lineWidth=2; ctx.beginPath();
      var xmin=mu-4*sig, xmax=mu+4*sig; for(var i=0;i<=400;i++){ var x=xmin + (xmax-xmin)*i/400; var y=Math.exp(-0.5*((x-mu)/sig)**2)/(sig*Math.sqrt(2*Math.PI)); var px=L + (x-xmin)/(xmax-xmin)*plotW; var py=H-B - y*(plotH/(1/(sig*Math.sqrt(2*Math.PI)))); if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);} ctx.stroke();
      // histogram of samples
      if(simChk.checked){ var n=parseInt(nIn.value,10); var xs=[]; for(var k=0;k<n;k++){ xs.push(mu + sig*randn()); } var bins=30; var counts=new Array(bins).fill(0); for(var k2=0;k2<xs.length;k2++){ var x=xs[k2]; if(x<xmin||x>xmax) continue; var b=Math.floor((x-xmin)/(xmax-xmin)*bins); b=Math.min(bins-1, Math.max(0,b)); counts[b]++; } var bw=plotW/bins; ctx.fillStyle='rgba(199,0,166,0.2)'; ctx.strokeStyle='rgba(199,0,166,0.6)'; for(var b2=0;b2<bins;b2++){ var h=counts[b2]/Math.max(1, Math.max.apply(null,counts))*plotH; var rx=L + b2*bw; var ry=H-B - h; ctx.beginPath(); ctx.rect(rx, ry, bw-1, h); ctx.fill(); ctx.stroke(); } }
    }

    function drawBinom(bn,bp){
      var kmax=bn; var pmax=0; for(var k=0;k<=bn;k++){ var p = comb(bn,k)*Math.pow(bp,k)*Math.pow(1-bp,bn-k); pmax=Math.max(pmax,p);} var bw=plotW/(kmax+1); ctx.fillStyle='rgba(199,0,166,0.2)'; ctx.strokeStyle='rgba(199,0,166,0.6)';
      for(var k=0;k<=bn;k++){ var p = comb(bn,k)*Math.pow(bp,k)*Math.pow(1-bp,bn-k); var h=p/pmax*plotH; var rx=L + k*bw; var ry=H-B - h; ctx.beginPath(); ctx.rect(rx, ry, bw-2, h); ctx.fill(); ctx.stroke(); }
    }

    function drawPoisson(lam){
      var kmax=Math.max(10, Math.ceil(lam+4*Math.sqrt(lam))); var pmax=0; for(var k=0;k<=kmax;k++){ var p = Math.exp(-lam)*Math.pow(lam,k)/fact(k); pmax=Math.max(pmax,p);} var bw=plotW/(kmax+1); ctx.fillStyle='rgba(199,0,166,0.2)'; ctx.strokeStyle='rgba(199,0,166,0.6)';
      for(var k=0;k<=kmax;k++){ var p = Math.exp(-lam)*Math.pow(lam,k)/fact(k); var h=p/pmax*plotH; var rx=L + k*bw; var ry=H-B - h; ctx.beginPath(); ctx.rect(rx, ry, bw-2, h); ctx.fill(); ctx.stroke(); }
    }

    function comb(n,k){ if(k<0||k>n) return 0; k=Math.min(k, n-k); var r=1; for(var i=1;i<=k;i++){ r=r*(n-k+i)/i; } return r; }
    function fact(m){ var r=1; for(var i=2;i<=m;i++) r*=i; return r; }

    if(type==='normal'){ var mu=parseFloat(document.getElementById('dx-mu').value); var sig=Math.max(0.1, parseFloat(document.getElementById('dx-sig').value)); drawNormal(mu,sig); document.getElementById('dx-info').textContent = 'μ='+mu.toFixed(2)+' σ='+sig.toFixed(2); }
    else if(type==='binom'){ var bn=parseInt(document.getElementById('dx-bn').value,10); var bp=Math.min(0.999, Math.max(0.001, parseFloat(document.getElementById('dx-bp').value))); drawBinom(bn,bp); document.getElementById('dx-info').textContent = 'E[X] = '+(bn*bp).toFixed(2)+' Var[X] = '+(bn*bp*(1-bp)).toFixed(2); }
    else { var lam=Math.max(0.1, parseFloat(document.getElementById('dx-lam').value)); drawPoisson(lam); document.getElementById('dx-info').textContent = 'E[X] = Var[X] = '+lam.toFixed(2); }

    if(!isResize){
      typeSel.addEventListener('change', function(){ initDist(false); });
      nIn.addEventListener('input', function(){ document.getElementById('dx-n-val').textContent=nIn.value; initDist(false); });
      container.addEventListener('change', function(e){ if(e.target && ['dx-mu','dx-sig','dx-bn','dx-bp','dx-lam','dx-sim'].includes(e.target.id)){ initDist(false); } });
    }
  }
})();

// ===== Correlation Simulator (Stats) =====
(function(){
  function ready(fn){ if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded', fn);} else { fn(); } }
  ready(function(){ initCorr(); window.addEventListener('resize', function(){ initCorr(true); }); });

  function initCorr(isResize){
    var container=document.getElementById('applet-corr'); if(!container) return;
    if(!isResize){
      container.innerHTML='';
      var controls=document.createElement('div'); controls.className='applet-controls';
      controls.innerHTML = ''+
        '<label>m: <input type="range" id="cr-m" min="-3" max="3" step="0.05" value="1"/> <span id="cr-m-val">1.00</span></label>'+
        '<label>noise: <input type="range" id="cr-noise" min="0" max="3" step="0.05" value="0.8"/> <span id="cr-noise-val">0.80</span></label>'+
        '<label>n: <input type="range" id="cr-n" min="20" max="500" step="10" value="150"/> <span id="cr-n-val">150</span></label>'+
        '<span id="cr-r"></span>';
      container.appendChild(controls);
      var canvas=document.createElement('canvas'); canvas.id='cr-canvas'; canvas.style.width='100%'; canvas.classList.add('applet-frame'); canvas.height=300; container.appendChild(canvas);
    }
    var canvas=document.getElementById('cr-canvas'); if(!canvas) return; var rect=canvas.getBoundingClientRect(); canvas.width=Math.max(420, Math.floor(rect.width));
    var ctx=canvas.getContext('2d'); var W=canvas.width, H=canvas.height; var L=50,R=20,T=20,B=40; var plotW=W-L-R, plotH=H-T-B;
    var mIn=document.getElementById('cr-m'), nIn=document.getElementById('cr-n'), zIn=document.getElementById('cr-noise');
    document.getElementById('cr-m-val').textContent=parseFloat(mIn.value).toFixed(2);
    document.getElementById('cr-n-val').textContent=parseInt(nIn.value,10);
    document.getElementById('cr-noise-val').textContent=parseFloat(zIn.value).toFixed(2);

    var m=parseFloat(mIn.value), n=parseInt(nIn.value,10), z=parseFloat(zIn.value);

    // sample
    var xs=[], ys=[]; for(var i=0;i<n;i++){ var x = (Math.random()*2-1)*3; var y = m*x + z*randn(); xs.push(x); ys.push(y); }

    // compute correlation
    function mean(a){ var s=0; for(var i=0;i<a.length;i++) s+=a[i]; return s/a.length; }
    var mx=mean(xs), my=mean(ys); var sx=0, sy=0, sxy=0; for(var i=0;i<n;i++){ var dx=xs[i]-mx, dy=ys[i]-my; sx+=dx*dx; sy+=dy*dy; sxy+=dx*dy; }
    var r = sxy/Math.sqrt(sx*sy);

    // axes
    ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(L,H-B); ctx.lineTo(W-R,H-B); ctx.stroke(); ctx.beginPath(); ctx.moveTo(L,T); ctx.lineTo(L,H-B); ctx.stroke();

    function sxp(x){ return L + (x+3)/6*plotW; } function syp(y){ return H-B - (y+3)/6*plotH; }

    // points
    ctx.fillStyle='rgba(0,179,255,0.7)'; for(var i=0;i<n;i++){ var px=sxp(xs[i]), py=syp(ys[i]); ctx.beginPath(); ctx.arc(px,py,2.5,0,Math.PI*2); ctx.fill(); }

    // reference line y = m x
    var x1=-3, x2=3, y1=m*x1, y2=m*x2; ctx.strokeStyle='#c700a6'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(sxp(x1),syp(y1)); ctx.lineTo(sxp(x2),syp(y2)); ctx.stroke();

    var rEl=document.getElementById('cr-r'); rEl.textContent = 'r = '+r.toFixed(3);

    if(!isResize){
      mIn.addEventListener('input', function(){ initCorr(false); });
      zIn.addEventListener('input', function(){ initCorr(false); });
      nIn.addEventListener('input', function(){ initCorr(false); });
    }

    function randn(){ let u=0,v=0; while(u===0) u=Math.random(); while(v===0) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
  }
})();

// ===== Parabola / Quadratic Explorer (Algebra) =====
(function(){
  function ready(fn){ if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded', fn);} else { fn(); } }
  ready(function(){ initParabola(); window.addEventListener('resize', function(){ initParabola(true); }); });

  function initParabola(isResize){
    var container = document.getElementById('applet-parabola'); if(!container) return;
    if(!isResize){
      container.innerHTML='';
      var controls = document.createElement('div'); controls.className='applet-controls';
      controls.innerHTML = ''+
        '<label>Form: <select id="qb-form"><option value="vertex">Vertex</option><option value="standard">Standard</option><option value="factored">Factored</option></select></label>'+
        '<span id="qb-params"></span>'+
        '<span id="qb-info"></span>';
      container.appendChild(controls);
      var canvas=document.createElement('canvas'); canvas.id='qb-canvas'; canvas.style.width='100%'; canvas.classList.add('applet-frame'); canvas.height=320; container.appendChild(canvas);
    }
    var canvas=document.getElementById('qb-canvas'); if(!canvas) return; var rect=canvas.getBoundingClientRect(); canvas.width=Math.max(420, Math.floor(rect.width));
    var ctx=canvas.getContext('2d'); var W=canvas.width, H=canvas.height; var L=50,R=20,T=20,B=40; var plotW=W-L-R, plotH=H-T-B;

    var formSel=document.getElementById('qb-form'); var form=formSel.value;
    var paramsSpan=document.getElementById('qb-params');
    function setParamsUI(){
      if(form==='vertex') paramsSpan.innerHTML = ' <label>a: <input type="range" id="qa" min="-3" max="3" step="0.05" value="1"/> <span id="qa-val">1.00</span></label> <label>h: <input type="range" id="qh" min="-5" max="5" step="0.1" value="0"/> <span id="qh-val">0.0</span></label> <label>k: <input type="range" id="qk" min="-5" max="5" step="0.1" value="0"/> <span id="qk-val">0.0</span></label>';
      else if(form==='standard') paramsSpan.innerHTML = ' <label>a: <input type="number" id="sa" value="1" style="width:70px"></label> <label>b: <input type="number" id="sb" value="0" style="width:70px"></label> <label>c: <input type="number" id="sc" value="0" style="width:70px"></label>';
      else paramsSpan.innerHTML = ' <label>a: <input type="number" id="fa" value="1" style="width:70px"></label> <label>r1: <input type="number" id="fr1" value="-1" style="width:70px"></label> <label>r2: <input type="number" id="fr2" value="2" style="width:70px"></label>';
    }
    if(!isResize){ setParamsUI(); }

    // axes
    ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(L,H-B); ctx.lineTo(W-R,H-B); ctx.stroke(); ctx.beginPath(); ctx.moveTo(L,T); ctx.lineTo(L,H-B); ctx.stroke();

    function sx(x){ return L + (x+6)/12*plotW; } function sy(y){ return H-B - (y+6)/12*plotH; }

    // draw grid
    ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; for(var i=-6;i<=6;i++){ var gx=sx(i); ctx.beginPath(); ctx.moveTo(gx, sy(-6)); ctx.lineTo(gx, sy(6)); ctx.stroke(); var gy=sy(i); ctx.beginPath(); ctx.moveTo(sx(-6), gy); ctx.lineTo(sx(6), gy); ctx.stroke(); }

    var a,h,k; var A,Bc,C; var label='';
    if(form==='vertex'){
      a=parseFloat(document.getElementById('qa').value); h=parseFloat(document.getElementById('qh').value); k=parseFloat(document.getElementById('qk').value);
      A=a; Bc=-2*a*h; C=a*h*h + k; label = 'y = '+a.toFixed(2)+'(x - '+h.toFixed(2)+')^2 + '+k.toFixed(2);
      // show vertex
      ctx.fillStyle='#00b3ff'; ctx.beginPath(); ctx.arc(sx(h), sy(k), 4, 0, Math.PI*2); ctx.fill();
    } else if(form==='standard'){
      A=parseFloat(document.getElementById('sa').value); Bc=parseFloat(document.getElementById('sb').value); C=parseFloat(document.getElementById('sc').value);
      var hv = -Bc/(2*A); var kv = A*hv*hv + Bc*hv + C; a=A; h=hv; k=kv; label = 'y = '+A.toFixed(2)+'x^2 + '+Bc.toFixed(2)+'x + '+C.toFixed(2);
      ctx.fillStyle='#00b3ff'; ctx.beginPath(); ctx.arc(sx(h), sy(k), 4, 0, Math.PI*2); ctx.fill();
    } else {
      var fa=parseFloat(document.getElementById('fa').value); var r1=parseFloat(document.getElementById('fr1').value); var r2=parseFloat(document.getElementById('fr2').value);
      A=fa; Bc=-fa*(r1+r2); C=fa*r1*r2; a=A; h=-(Bc)/(2*A); k=A*h*h + Bc*h + C; label = 'y = '+fa.toFixed(2)+'(x - '+r1.toFixed(2)+')(x - '+r2.toFixed(2)+')';
      // x-intercepts
      ctx.fillStyle='#ffb300'; if(isFinite(r1)) { ctx.beginPath(); ctx.arc(sx(r1), sy(0), 3.5, 0, Math.PI*2); ctx.fill(); }
      if(isFinite(r2)) { ctx.beginPath(); ctx.arc(sx(r2), sy(0), 3.5, 0, Math.PI*2); ctx.fill(); }
      // vertex
      ctx.fillStyle='#00b3ff'; ctx.beginPath(); ctx.arc(sx(h), sy(k), 4, 0, Math.PI*2); ctx.fill();
    }

    // plot parabola from x=-6..6
    ctx.strokeStyle='#c700a6'; ctx.lineWidth=2; ctx.beginPath();
    for(var t=0;t<=400;t++){
      var x = -6 + 12*t/400; var y = A*x*x + Bc*x + C; var px=sx(x), py=sy(y); if(t===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.stroke();

    // axis of symmetry
    ctx.strokeStyle='rgba(199,0,166,0.5)'; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(sx(h), sy(-6)); ctx.lineTo(sx(h), sy(6)); ctx.stroke(); ctx.setLineDash([]);

    // focus and directrix (optional informational)
    if(a!==0){ var p = 1/(4*a); var focusY = k + p; var directrixY = k - p; ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(sx(h), sy(focusY), 2.5, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.moveTo(sx(-6), sy(directrixY)); ctx.lineTo(sx(6), sy(directrixY)); ctx.stroke(); }

    var info=document.getElementById('qb-info'); info.textContent = label + '   Vertex ('+h.toFixed(2)+', '+k.toFixed(2)+')  a='+a.toFixed(2);

    if(!isResize){
      formSel.addEventListener('change', function(){ setParamsUI(); initParabola(false); });
      container.addEventListener('input', function(e){ if(['qa','qh','qk','sa','sb','sc','fa','fr1','fr2'].includes(e.target.id)){ var el=document.getElementById(e.target.id+'-val'); if(el){ el.textContent = parseFloat(e.target.value).toFixed(e.target.id==='qa'?2:1); } initParabola(false); } });
    }
  }
})();

// ===== Parallel Lines Angle Lab (Geometry) =====
(function(){
  function ready(fn){ if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded', fn);} else { fn(); } }
  ready(function(){ initParallel(); window.addEventListener('resize', function(){ initParallel(true); }); });

  function initParallel(isResize){
    var container = document.getElementById('applet-parallel'); if(!container) return;
    if(!isResize){
      container.innerHTML='';
      var controls=document.createElement('div'); controls.className='applet-controls';
      controls.innerHTML = '<label>Angle (°): <input type="range" id="pl-ang" min="-60" max="60" step="1" value="20"/> <span id="pl-ang-val">20</span></label>';
      container.appendChild(controls);
      var svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('id','pl-svg'); svg.style.width='100%'; svg.classList.add('applet-frame'); svg.setAttribute('height','320'); container.appendChild(svg);
      var info=document.createElement('div'); info.id='pl-info'; info.style.marginTop='8px'; container.appendChild(info);
    }
    var svgEl=document.getElementById('pl-svg'); if(!svgEl) return; var rect=svgEl.getBoundingClientRect(); var W=Math.max(420, Math.floor(rect.width)); var H=320; svgEl.setAttribute('width',W); svgEl.setAttribute('height',H);
    while(svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

    var angIn=document.getElementById('pl-ang'); document.getElementById('pl-ang-val').textContent=angIn.value;
    var theta = parseFloat(angIn.value) * Math.PI/180;

    // Lines
    var y1=H*0.35, y2=H*0.65; var x0=W*0.15; var len=W*0.7;
    function line(x1,y1,x2,y2,attrs){ var el=document.createElementNS('http://www.w3.org/2000/svg','line'); el.setAttribute('x1',x1); el.setAttribute('y1',y1); el.setAttribute('x2',x2); el.setAttribute('y2',y2); for(var k in attrs){ el.setAttribute(k, attrs[k]); } svgEl.appendChild(el); return el; }

    line(x0, y1, x0+len, y1, {stroke:'rgba(255,255,255,0.6)', 'stroke-width':3});
    line(x0, y2, x0+len, y2, {stroke:'rgba(255,255,255,0.6)', 'stroke-width':3});

    // Transversal through center
    var cx=W/2; var cy=(y1+y2)/2; var dx=Math.cos(theta), dy=Math.sin(theta);
    var t1=-1000, t2=1000; var xA=cx+dx*t1, yA=cy+dy*t1, xB=cx+dx*t2, yB=cy+dy*t2;
    line(xA,yA,xB,yB,{stroke:'#c700a6','stroke-width':3});

    // Intersections
    function intersectY(y){ var t=(y-cy)/dy; return {x: cx+dx*t, y: y}; }
    var P1 = intersectY(y1); var P2 = intersectY(y2);

    // Mark equal angle sets around each intersection
    function drawAngleSet(P, upward){
      var r=26;
      var base = upward ? 1 : -1; // orientation relative to transversal
      // Four labeled angles
      var angles = [0, Math.PI/2, Math.PI, -Math.PI/2];
      for(var i=0;i<4;i++){
        var t = theta + angles[i];
        var a1 = t - 0.3, a2 = t + 0.3;
        var ax1 = P.x + r*Math.cos(a1), ay1 = P.y + r*Math.sin(a1);
        var ax2 = P.x + r*Math.cos(a2), ay2 = P.y + r*Math.sin(a2);
        var path=document.createElementNS('http://www.w3.org/2000/svg','path');
        var large=0, sweep=1; path.setAttribute('d', 'M '+ax1+','+ay1+' A '+r+','+r+' 0 '+large+' '+sweep+' '+ax2+','+ay2);
        path.setAttribute('stroke','rgba(199,0,166,0.8)'); path.setAttribute('stroke-width','3'); path.setAttribute('fill','none'); svgEl.appendChild(path);
      }
    }

    drawAngleSet(P1, true); drawAngleSet(P2, false);

    // Update info text with corresponding/alternate interior equalities
    var deg = Math.abs(parseFloat(angIn.value));
    document.getElementById('pl-info').textContent = 'Corresponding and alternate interior angles are congruent. Angle measure set by slider: '+deg.toFixed(1)+'°';

    if(!isResize){ angIn.addEventListener('input', function(){ initParallel(false); }); }
  }
})();

// ===== Glossary Filter (site-wide) =====
(function(){
  function ready(fn){ if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded', fn);} else { fn(); } }
  ready(function(){ initGlossary(); });

  function initGlossary(){
    var list = document.getElementById('glossary-list'); if(!list) return; // not on glossary page
    var search = document.getElementById('glossary-search');
    var clearBtn = document.getElementById('glossary-clear');
    var tagsWrap = document.getElementById('glossary-tags');
    var countEl = document.getElementById('glossary-count');
    var emptyEl = document.getElementById('glossary-empty');
    var items = Array.prototype.slice.call(document.querySelectorAll('.glossary-item'));
    var selected = new Set();

    function normalize(s){ return (s||'').toLowerCase(); }

    function apply(){
      var q = normalize(search.value);
      var shown = 0;
      items.forEach(function(it){
        var term = normalize(it.getAttribute('data-term'));
        var text = normalize(it.textContent);
        var tags = (it.getAttribute('data-tags')||'').split(',').map(function(t){return t.trim();});
        var tagOk = Array.from(selected).every(function(t){ return tags.indexOf(t) !== -1; });
        var textOk = !q || term.indexOf(q) !== -1 || text.indexOf(q) !== -1;
        var vis = tagOk && textOk;
        it.style.display = vis ? '' : 'none';
        if(vis) shown++;
      });
      if(countEl) countEl.textContent = shown + ' shown';
      if(emptyEl) emptyEl.style.display = shown === 0 ? '' : 'none';
    }

    // Toggle tags
    tagsWrap.addEventListener('click', function(e){
      var t = e.target.closest('.tag-chip'); if(!t) return;
      var tag = t.getAttribute('data-tag');
      if(t.classList.contains('active')){ t.classList.remove('active'); selected.delete(tag); }
      else { t.classList.add('active'); selected.add(tag); }
      apply();
    });

    // Search
    search.addEventListener('input', apply);
    clearBtn.addEventListener('click', function(){ selected.clear(); Array.prototype.forEach.call(tagsWrap.querySelectorAll('.tag-chip'), function(c){ c.classList.remove('active'); }); search.value=''; apply(); });

    apply();
  }
})();

// ===== Boxplot + Summary Stats (Statistics) =====
(function(){
  function ready(fn){ if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded', fn);} else { fn(); } }
  ready(function(){ initBoxplot(); window.addEventListener('resize', function(){ initBoxplot(true); }); });

  function initBoxplot(isResize){
    var container = document.getElementById('applet-boxplot'); if(!container) return;
    if(!isResize){
      container.innerHTML = '';
      var controls = document.createElement('div'); controls.className = 'applet-controls';
      controls.innerHTML = ''+
        '<label>Data: <select id="bx-type"><option value="normal">Normal</option><option value="uniform">Uniform</option><option value="skewed">Skewed</option></select></label>'+
        '<label>n: <input type="range" id="bx-n" min="20" max="1000" step="10" value="200"/> <span id="bx-n-val">200</span></label>'+
        '<button id="bx-resample" type="button">Resample</button>'+
        '<span id="bx-stats"></span>';
      container.appendChild(controls);
      var canvas = document.createElement('canvas'); canvas.id='bx-canvas'; canvas.style.width='100%'; canvas.classList.add('applet-frame'); canvas.height=180; container.appendChild(canvas);
    }
    var canvas=document.getElementById('bx-canvas'); if(!canvas) return; var rect=canvas.getBoundingClientRect(); canvas.width=Math.max(420, Math.floor(rect.width));
    var ctx=canvas.getContext('2d'); var W=canvas.width, H=canvas.height; var L=50,R=20,T=20,B=40; var plotW=W-L-R, plotH=H-T-B;
    var type=document.getElementById('bx-type').value; var n=parseInt(document.getElementById('bx-n').value,10); document.getElementById('bx-n-val').textContent=n;

    // sample generators
    function randn(){ let u=0,v=0; while(u===0) u=Math.random(); while(v===0) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
    function sample(){
      var a=[]; if(type==='normal'){ for(var i=0;i<n;i++){ a.push(randn()); } }
      else if(type==='uniform'){ for(var j=0;j<n;j++){ a.push(Math.random()*2-1); } }
      else { for(var k=0;k<n;k++){ // skewed (square of uniform with sign)
        var u=Math.random()*2-1; a.push(Math.sign(u)*u*u*2); }
      }
      return a;
    }

    var data = sample().sort(function(x,y){return x-y});

    function quantile(a, p){
      if(a.length===0) return NaN; var idx = (a.length-1)*p; var lo=Math.floor(idx), hi=Math.ceil(idx); if(lo===hi) return a[lo]; var t=idx-lo; return a[lo]*(1-t)+a[hi]*t;
    }
    var q1=quantile(data,0.25), med=quantile(data,0.5), q3=quantile(data,0.75), iqr=q3-q1;
    var lowFence=q1-1.5*iqr, highFence=q3+1.5*iqr;
    var low = data.find(v=>v>=lowFence); var high = [...data].reverse().find(v=>v<=highFence);
    if(low===undefined) low=data[0]; if(high===undefined) high=data[data.length-1];
    var mean = data.reduce((s,v)=>s+v,0)/data.length;

    // axes baseline
    ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(L,H-B); ctx.lineTo(W-R,H-B); ctx.stroke();

    // scale to whiskers span
    var xmin=Math.min(lowFence, data[0]), xmax=Math.max(highFence, data[data.length-1]); var pad=(xmax-xmin)*0.05||1; xmin-=pad; xmax+=pad;
    function sx(x){ return L + (x-xmin)/(xmax-xmin)*plotW; }

    // whiskers
    ctx.strokeStyle='rgba(199,0,166,0.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(sx(low), H-B-30); ctx.lineTo(sx(low), H-B-10); ctx.moveTo(sx(high), H-B-30); ctx.lineTo(sx(high), H-B-10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx(low), H-B-20); ctx.lineTo(sx(q1), H-B-20); ctx.moveTo(sx(q3), H-B-20); ctx.lineTo(sx(high), H-B-20); ctx.stroke();

    // box
    ctx.fillStyle='rgba(199,0,166,0.2)'; ctx.strokeStyle='rgba(199,0,166,0.8)'; var yTop=H-B-40, yBot=H-B; ctx.beginPath(); ctx.rect(sx(q1), yTop, sx(q3)-sx(q1), yBot-yTop); ctx.fill(); ctx.stroke();
    // median
    ctx.strokeStyle='#c700a6'; ctx.beginPath(); ctx.moveTo(sx(med), yTop); ctx.lineTo(sx(med), yBot); ctx.stroke();
    // mean marker
    ctx.strokeStyle='rgba(0,179,255,0.9)'; ctx.beginPath(); ctx.moveTo(sx(mean), yTop); ctx.lineTo(sx(mean), yBot); ctx.stroke();

    // outliers
    ctx.fillStyle='rgba(255,255,255,0.8)';
    for(var t=0;t<data.length;t++){
      if(data[t]<low || data[t]>high){ ctx.beginPath(); ctx.arc(sx(data[t]), H-B-20, 2.5, 0, Math.PI*2); ctx.fill(); }
    }

    var statsEl=document.getElementById('bx-stats'); if(statsEl){ statsEl.textContent = 'min='+data[0].toFixed(2)+'  Q1='+q1.toFixed(2)+'  median='+med.toFixed(2)+'  Q3='+q3.toFixed(2)+'  max='+data[data.length-1].toFixed(2)+'  mean='+mean.toFixed(2); }

    if(!isResize){
      document.getElementById('bx-resample').addEventListener('click', function(){ initBoxplot(false); });
      document.getElementById('bx-type').addEventListener('change', function(){ initBoxplot(false); });
      document.getElementById('bx-n').addEventListener('input', function(){ initBoxplot(false); });
    }
  }
})();

// ===== Trig Grapher (Sine/Cosine) =====
(function(){
  function ready(fn){ if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded', fn);} else { fn(); } }
  ready(function(){ initTrigGrapher(); window.addEventListener('resize', function(){ initTrigGrapher(true); }); });

  function initTrigGrapher(isResize){
    var container=document.getElementById('applet-trig-grapher'); if(!container) return;
    if(!isResize){
      container.innerHTML='';
      var controls=document.createElement('div'); controls.className='applet-controls';
      controls.innerHTML = ''+
        '<label>f: <select id="tg-f"><option value="sin">sin</option><option value="cos">cos</option></select></label>'+
        '<label>A: <input type="range" id="tg-A" min="0" max="3" step="0.05" value="1"/> <span id="tg-A-val">1.00</span></label>'+
        '<label>B: <input type="range" id="tg-B" min="0.5" max="4" step="0.05" value="1"/> <span id="tg-B-val">1.00</span></label>'+
        '<label>C: <input type="range" id="tg-C" min="-3.1416" max="3.1416" step="0.01" value="0"/> <span id="tg-C-val">0.00</span></label>'+
        '<label>D: <input type="range" id="tg-D" min="-2" max="2" step="0.05" value="0"/> <span id="tg-D-val">0.00</span></label>'+
        '<span id="tg-eq"></span>';
      container.appendChild(controls);
      var canvas=document.createElement('canvas'); canvas.id='tg-canvas'; canvas.style.width='100%'; canvas.classList.add('applet-frame'); canvas.height=280; container.appendChild(canvas);
    }
    var canvas=document.getElementById('tg-canvas'); if(!canvas) return; var rect=canvas.getBoundingClientRect(); canvas.width=Math.max(420, Math.floor(rect.width));
    var ctx=canvas.getContext('2d'); var W=canvas.width, H=canvas.height; var L=50,R=20,T=20,B=40; var plotW=W-L-R, plotH=H-T-B;

    var fSel=document.getElementById('tg-f'); var AIn=document.getElementById('tg-A'); var BIn=document.getElementById('tg-B'); var CIn=document.getElementById('tg-C'); var DIn=document.getElementById('tg-D');
    var A=parseFloat(AIn.value), B=parseFloat(BIn.value), C=parseFloat(CIn.value), D=parseFloat(DIn.value);
    document.getElementById('tg-A-val').textContent=A.toFixed(2); document.getElementById('tg-B-val').textContent=B.toFixed(2); document.getElementById('tg-C-val').textContent=C.toFixed(2); document.getElementById('tg-D-val').textContent=D.toFixed(2);

    function f(x){ var g = fSel.value==='sin' ? Math.sin : Math.cos; return A * g(B*(x - C)) + D; }

    // domain [-2π, 2π]
    var xmin=-2*Math.PI, xmax=2*Math.PI; var ymin=-Math.max(2, Math.abs(A)+Math.abs(D)+0.5), ymax=Math.max(2, Math.abs(A)+Math.abs(D)+0.5);
    function sx(x){ return L + (x-xmin)/(xmax-xmin)*plotW; } function sy(y){ return H-B - (y-ymin)/(ymax-ymin)*plotH; }

    // background + axes
    ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(L, sy(0)); ctx.lineTo(W-R, sy(0)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(sx(0), T); ctx.lineTo(sx(0), H-B); ctx.stroke();

    // vertical grid at multiples of π/2
    ctx.strokeStyle='rgba(255,255,255,0.15)'; for(var k=-4;k<=4;k++){ var xv = k*Math.PI/2; ctx.beginPath(); ctx.moveTo(sx(xv), T); ctx.lineTo(sx(xv), H-B); ctx.stroke(); }

    // plot
    ctx.strokeStyle='#c700a6'; ctx.lineWidth=2; ctx.beginPath(); for(var i=0;i<=800;i++){ var x=xmin + (xmax-xmin)*i/800; var y=f(x); var px=sx(x), py=sy(y); if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.stroke();

    // equation text
    var eqEl=document.getElementById('tg-eq'); var fn=fSel.value; var period=(2*Math.PI)/B; eqEl.textContent = 'y = '+A.toFixed(2)+' · '+fn+'('+B.toFixed(2)+'(x - '+C.toFixed(2)+')) + '+D.toFixed(2)+'   |   Period ≈ '+period.toFixed(2);

    if(!isResize){
      [fSel,AIn,BIn,CIn,DIn].forEach(function(el){ el.addEventListener('input', function(){ initTrigGrapher(false); }); });
    }
  }
})();
