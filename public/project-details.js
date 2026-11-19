/** Staff-only project summary and explicit save/cancel editor. */
export function createProjectDetails({record,document,onSave,isActive=()=>true}) {
  const node=(tag,className,text)=>{const el=document.createElement(tag);el.className=className;if(text!==undefined)el.textContent=text;return el;};
  const section=node('section','project-details'),heading=node('h4','','Painting / project type');
  const type=node('p','project-type',record.projectType||'Project type not recorded');
  const notes=node('p','project-notes',record.projectNotes||'No project notes yet.');
  const editor=node('details','project-editor'),summary=node('summary','','Edit project details');
  const form=node('form','project-form'),typeLabel=node('label','','Painting / project type'),typeInput=node('input','');
  typeInput.type='text';typeInput.maxLength=160;typeInput.value=record.projectType||'';
  typeInput.placeholder='For example, exterior brick and shutters';typeLabel.append(typeInput);
  const notesLabel=node('label','','Project notes · staff only'),notesInput=node('textarea','');
  notesInput.maxLength=4000;notesInput.rows=5;notesInput.value=record.projectNotes||'';
  notesInput.placeholder='Surfaces, rooms, colors, prep work, access instructions, or anything to remember before the visit.';
  notesLabel.append(notesInput);
  const actions=node('div','project-actions'),save=node('button','button small','Save project details'),cancel=node('button','button secondary small','Cancel');
  save.type='submit';cancel.type='button';save.setAttribute('data-action-button','');cancel.setAttribute('data-action-button','');
  const status=node('p','project-save-status');status.setAttribute('role','status');
  let saving=false;
  cancel.addEventListener('click',()=>{if(saving||!isActive())return;form.reset();typeInput.value=record.projectType||'';notesInput.value=record.projectNotes||'';status.textContent='';editor.open=false;});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(saving||!isActive()||!form.reportValidity())return;
    saving=true;save.disabled=true;cancel.disabled=true;typeInput.disabled=true;notesInput.disabled=true;status.textContent='Saving project details…';
    try {
      await onSave({projectType:typeInput.value,projectNotes:notesInput.value,projectRevision:record.projectRevision??0});
      status.textContent='Project details saved.';editor.open=false;
    } catch(error) {status.textContent=error?.safeMessage||'Could not save. Your edits are still here. Check the connection and try again.';}
    finally {saving=false;save.disabled=false;cancel.disabled=false;typeInput.disabled=false;notesInput.disabled=false;}
  });
  actions.append(save,cancel);form.append(typeLabel,notesLabel,actions,status);editor.append(summary,form);
  section.append(heading,type,notes,editor);return section;
}
