/* Shared markdown helpers for UPSCviaPYQs — copied verbatim from the explorers' proven
   renderer (0-crash over the full dataset), plus answer-coverage helpers for writing practice.
   Loaded as a plain <script src="md.js">; all functions are global. KaTeX is applied separately. */
const esc = s => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inline(t){
  t=esc(t);
  t=t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  t=t.replace(/\*\*([^*]+?)\*\*/g,"<strong>$1</strong>");
  t=t.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g,"$1<em>$2</em>");
  t=t.replace(/`([^`]+?)`/g,"<code>$1</code>");
  return t;
}
function renderList(items){
  let out="",i=0;
  while(i<items.length){
    const base=items[i].indent, ordered=items[i].ordered;
    out+=ordered?"<ol>":"<ul>";
    while(i<items.length && items[i].indent===base){
      let li="<li>"+inline(items[i].text);
      let j=i+1; const kids=[];
      while(j<items.length && items[j].indent>base){kids.push(items[j]);j++;}
      if(kids.length) li+=renderList(kids);
      out+=li+"</li>"; i=j;
    }
    out+=ordered?"</ol>":"</ul>";
  }
  return out;
}
function mdToHtml(md){
  if(!md) return "";
  const lines=md.replace(/\r\n?/g,"\n").split("\n");
  let html="",i=0,para=[];
  const flush=()=>{ if(para.length){html+="<p>"+inline(para.join(" "))+"</p>";para=[];} };
  const listRe=/^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
  const tableSep=/^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)+\|?\s*$/;
  while(i<lines.length){
    const ln=lines[i], t=ln.trim();
    if(!t){ flush(); i++; continue; }
    if(/^(-{3,}|\*{3,}|_{3,})$/.test(t)){ flush(); html+="<hr>"; i++; continue; }
    let h=t.match(/^(#{1,6})\s+(.*)$/);
    if(h){ flush(); let lv=Math.min(h[1].length+1,4); html+="<h"+lv+">"+inline(h[2].replace(/\s*#+\s*$/,""))+"</h"+lv+">"; i++; continue; }
    if(t.indexOf("|")>=0 && i+1<lines.length && tableSep.test(lines[i+1])){
      flush();
      const cells=r=>r.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(c=>c.trim());
      const head=cells(t);
      html+="<table><thead><tr>"+head.map(c=>"<th>"+inline(c)+"</th>").join("")+"</tr></thead><tbody>";
      i+=2;
      while(i<lines.length && lines[i].indexOf("|")>=0 && lines[i].trim()){
        const r=cells(lines[i]); html+="<tr>"+r.map(c=>"<td>"+inline(c)+"</td>").join("")+"</tr>"; i++;
      }
      html+="</tbody></table>"; continue;
    }
    if(/^>\s?/.test(t)){ flush(); const buf=[]; while(i<lines.length && /^\s*>\s?/.test(lines[i])){buf.push(lines[i].replace(/^\s*>\s?/,""));i++;} html+="<blockquote>"+inline(buf.join(" "))+"</blockquote>"; continue; }
    if(listRe.test(ln)){
      flush(); const items=[];
      while(i<lines.length){
        const m=lines[i].match(listRe);
        if(!m){ break; }
        items.push({indent:m[1].replace(/\t/g,"  ").length, ordered:/\d/.test(m[2]), text:m[3]});
        i++;
      }
      html+=renderList(items); continue;
    }
    let b=t.match(/^\*\*(.+?)\*\*[:：]?\s*$/);
    if(b){ flush(); html+='<div class="mdsub">'+inline(b[1])+"</div>"; i++; continue; }
    para.push(t); flush(); i++;
  }
  flush();
  return html;
}
function splitBody(x){
  const body=(x.body_md||"").replace(/\r\n?/g,"\n");
  const lines=body.split("\n");
  let first=lines.findIndex(l=>l.trim()!=="");
  if(first<0) return {stem:x.question_md||"(question)", ans:""};
  let stem=lines[first].trim().replace(/^[-*+]\s+/,"").trim();
  const ans=lines.slice(first+1).join("\n").trim();
  return {stem:stem||x.question_md||"(question)", ans};
}

/* ---- answer-writing self-check helpers ---- */
// key points = bold-led phrases in the model answer (the points a good answer should cover)
function keyPoints(body){
  const lines=(body||"").replace(/\r\n?/g,"\n").split("\n"), pts=[], seen={};
  const skip=/^(introduction|body|conclusion|essay|topic breakdown|essay outline|core message|definition|quote|context|outline|answer)$/i;
  lines.forEach(l=>{
    const m=l.match(/^\s*[-*+]?\s*\*\*([^*]{3,60})\*\*/);
    if(!m) return;
    let t=m[1].replace(/[:：]\s*$/,"").trim();
    if(!t || skip.test(t)) return;
    const k=t.toLowerCase(); if(seen[k]) return; seen[k]=1; pts.push(t);
  });
  return pts.slice(0,10);
}
const _STOP={the:1,and:1,of:1,to:1,in:1,a:1,for:1,is:1,on:1,with:1,as:1,by:1,an:1,be:1,or:1,are:1,at:1,from:1,that:1,this:1,its:1,it:1,their:1,which:1,not:1,but:1};
// rough coverage estimate: a point is "covered" if its phrase appears, or >=60% of its
// significant words appear, in the user's text. Deliberately heuristic — a self-check aid, not a grade.
function coverage(text, points){
  const u=(text||"").toLowerCase();
  return points.map(p=>{
    const phrase=p.toLowerCase();
    if(u.indexOf(phrase)>=0) return {point:p, hit:true};
    const words=phrase.split(/[^a-z0-9]+/).filter(w=>w.length>=4 && !_STOP[w]);
    if(!words.length) return {point:p, hit:false};
    const hits=words.filter(w=>u.indexOf(w)>=0).length;
    return {point:p, hit: hits/words.length>=0.6};
  });
}
