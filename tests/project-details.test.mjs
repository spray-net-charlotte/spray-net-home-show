import test from 'node:test';
import assert from 'node:assert/strict';
import {createProjectDetails} from '../public/project-details.js';

function fixture(onSave,record={projectType:'Exterior brick',projectNotes:'Side gate',projectRevision:3}) {
  let active=true;
  const document={createElement:tag=>new Element(tag)};
  class Element extends EventTarget {
    constructor(tag){super();this.tagName=tag;this.children=[];this._text='';this.attributes=new Map();}
    append(...items){this.children.push(...items);}
    setAttribute(key,value){this.attributes.set(key,value);}
    set textContent(value){this._text=String(value);this.children=[];}
    get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
    set innerHTML(_){throw new Error('Staff data must be rendered as text.');}
    reportValidity(){return true;}
    reset(){}
  }
  const root=createProjectDetails({record,document,onSave,isActive:()=>active});
  const all=(el=root)=>[el,...el.children.flatMap(child=>all(child))];
  return {root,all,form:all().find(el=>el.tagName==='form'),type:all().find(el=>el.tagName==='input'),
    notes:all().find(el=>el.tagName==='textarea'),editor:all().find(el=>el.tagName==='details'),
    status:all().find(el=>el.attributes.get('role')==='status'),cancel:all().find(el=>el.textContent==='Cancel'),lock:()=>{active=false;}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('project editor saves exact type and multiline notes once, locks pending edits, and cancels without writing',async()=>{
  const writes=[];let finish;
  const view=fixture(body=>{writes.push(body);return new Promise(resolve=>{finish=resolve;});});
  view.type.value='Kitchen cabinets + island';view.notes.value='Doors and drawers\nKeep existing hardware.';view.editor.open=true;
  view.form.dispatchEvent(new Event('submit',{cancelable:true}));view.form.dispatchEvent(new Event('submit',{cancelable:true}));
  assert.equal(writes.length,1);assert.deepEqual(writes[0],{projectType:view.type.value,projectNotes:view.notes.value,projectRevision:3});
  assert.equal(view.type.disabled,true);assert.equal(view.notes.disabled,true);
  finish();await settle();assert.equal(view.editor.open,false);assert.match(view.status.textContent,/saved/);
  view.type.value='Unsaved';view.cancel.dispatchEvent(new Event('click'));assert.equal(view.type.value,'Exterior brick');assert.equal(writes.length,1);
  view.lock();view.form.dispatchEvent(new Event('submit',{cancelable:true}));assert.equal(writes.length,1);
});

test('failed saves retain draft notes and conflict guidance; customer text cannot become markup',async()=>{
  const view=fixture(async()=>{throw {safeMessage:'Newer project details exist. Copy your notes, then refresh.'};},
    {projectType:'<img src=x onerror=alert(1)>',projectNotes:'<script>private</script>',projectRevision:0});
  assert.ok(view.root.textContent.includes('<script>private</script>'));
  view.type.value='Exterior';view.notes.value='Remember side entry';view.editor.open=true;
  view.form.dispatchEvent(new Event('submit',{cancelable:true}));await settle();
  assert.equal(view.editor.open,true);assert.equal(view.notes.value,'Remember side entry');assert.equal(view.type.disabled,false);
  assert.match(view.status.textContent,/Copy your notes/);
});
