import {getDefaultData} from './seed.js';
import {validState,petTypes,categories} from './journal.js';
import {types,esc,cap,icon,localDate,dayKey,petAvatar,currentWeight,empty,navigation,pageHeading,overview,collection} from './views.js';

const find = selector => document.querySelector(selector);
const dialog = find('#modal');
let state=getDefaultData(), revision=0, connected=false, pending=false, toastTimer, boot;
const filters={activity:'all',schedule:'upcoming'};
const activePet=()=>state.pets.find(pet=>pet.id===state.selectedPetId)||state.pets[0];
const activeView=()=>['activity','schedule'].includes(location.hash.slice(1))?location.hash.slice(1):'overview';
const id=()=>crypto.randomUUID();
function render() {
  const view=activeView(), pet=activePet();
  find('#navigation').innerHTML=navigation(view);
  find('#content').innerHTML=pageHeading(view, pet)+(pet?(view==='overview'?overview(state,pet):collection(view,state,pet,filters[view])):`<section class="panel no-pets">${empty('Meet your first pet','Create a profile to start your care journal.')}<button class="primary" data-action="new-pet">${icon('plus')}Add a pet</button></section>`);
}
function toast(message) {
  const node=find('#toast');node.textContent=message;node.classList.add('visible'); clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('visible'),4200);
}
function banner(message='') {
  const node=find('#connection');node.hidden=!message;node.innerHTML=message?`${icon('circle-help')}<span>${esc(message)}</span><button data-action="retry">Reconnect</button>`:'';
}
async function api(path,options={}) {
  let response;
  try { response=await fetch(path,{...options,credentials:'same-origin',cache:'no-store'}); } catch { throw new Error('Could not connect. Your changes have not been saved.'); }
  const data=await response.json().catch(()=>null);
  if (!data) throw new Error('The journal service is not available. Reconnect and try again.');
  if (!response.ok) {const error=new Error(data.error||'Could not save your journal. Try again.');error.status=response.status;throw error;}
  return data;
}
const put=(next,version)=>api('/api/journal',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:next,revision:version})});
async function load() {
  try {
    const result=await api('/api/journal');
    if (result.state) {if(!validState(result.state)) throw new Error('Invalid records.'); state=result.state;revision=result.revision;}
    else {const starter=getDefaultData();const saved=await put(starter,0);state=starter;revision=saved.revision;}
    connected=true;banner();render();return true;
  } catch {connected=false;banner('Journal unavailable. Reconnect to load or save your records.');return false;}
}
function statusError(message) {
  const target=dialog.open&&find('#form-error');
  if (target) {target.textContent=message;target.hidden=false;} else toast(message);
}
function legacyType(value) {
  const mapping={dog:/dog|retriever|terrier|poodle|spaniel|hound|shepherd|bulldog/i,cat:/cat|scottish fold|siamese|persian|tabby/i,bird:/bird|parrot|finch|budgie|canary/i,rabbit:/rabbit|bunny/i,rodent:/rodent|hamster|guinea pig|gerbil/i,fish:/fish|betta|tetra/i,reptile:/reptile|gecko|lizard|snake|turtle/i};
  return Object.entries(mapping).find(([,pattern])=>pattern.test(value||''))?.[0]||'other';
}
async function save(change,message,close=true) {
  if (pending) return false;
  pending=true;dialog.setAttribute('aria-busy','true');
  const submit=dialog.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
  try {
    await boot;
    if (!connected && !(await load())) throw new Error('Connect to the journal before saving. Your form is still here.');
    const next=structuredClone(state);await change(next);
    if (!validState(next)) throw new Error('Check the names, dates, and measurements before saving.');
    const saved=await put(next,revision);state=next;revision=saved.revision;render();if (close&&dialog.open)dialog.close();toast(message);return true;
  } catch (error) {if(error.status===409){await load();if(dialog.open)dialog.close();}statusError(error.message);return false;}
  finally {pending=false;dialog.removeAttribute('aria-busy');if(submit)submit.disabled=false;}
}
function modal(title,subtitle,svg,body) {
  find('#modal-body').innerHTML=`<div class="modal-top"><span class="modal-icon">${icon(svg)}</span><button class="icon-button" data-action="close" aria-label="Close dialog">${icon('x')}</button></div><div class="eyebrow">${esc(subtitle)}</div><h2 id="dialog-title">${esc(title)}</h2><p id="form-error" class="form-error" role="alert" hidden></p>${body}`;
  dialog.setAttribute('aria-labelledby','dialog-title');if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
}
const field=(label,name,value='',options={})=>`<label class="field"><span>${esc(label)}</span><input name="${name}" type="${options.type||'text'}" value="${esc(value)}" ${options.required?'required':''} ${options.type==='number'?'step="any" min="0.001" max="99999"':''} ${options.max?`max="${esc(options.max)}"`:''} maxlength="${options.length||160}" placeholder="${esc(options.placeholder||'')}"></label>`;
const select=(label,name,choices,selected)=>`<label class="field"><span>${esc(label)}</span><select name="${name}">${choices.map(choice=>{const [value,text]=Array.isArray(choice)?choice:[choice,choice];return `<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(text)}</option>`;}).join('')}</select></label>`;
const notes=value=>`<label class="field"><span>Notes <small>Optional</small></span><textarea name="notes" rows="3" maxlength="2000" placeholder="Anything worth remembering?">${esc(value)}</textarea></label>`;
const formActions=(label,remove='')=>`<div class="form-actions">${remove?`<button class="danger-icon" type="button" data-action="${remove}" aria-label="Delete record">${icon('trash-2')}</button>`:''}<button type="button" class="secondary" data-action="close">Cancel</button><button class="primary" type="submit">${esc(label)}</button></div>`;
const upsert=(rows,record)=>{const index=rows.findIndex(item=>item.id===record.id);if(index<0)rows.push(record);else rows[index]=record;};
const values=form=>Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,typeof value==='string'?value.trim():value]));
function confirmAction(title,description,action,label='Delete',danger=true) {
  modal(title,'CONFIRM ACTION',danger?'trash-2':'file-up',`<p class="dialog-copy">${esc(description)}</p><div class="form-actions"><button class="secondary" data-action="close">Cancel</button><button class="${danger?'danger':'primary'}" id="confirm-action">${esc(label)}</button></div>`);find('#confirm-action').onclick=action;
}
function showPets() {
  modal('Your pets','PET PROFILES','paw-print',`<div class="pet-options">${state.pets.map(pet=>`<button class="pet-option ${pet.id===activePet()?.id?'selected':''}" data-action="select-pet" data-id="${esc(pet.id)}">${petAvatar(pet)}<span><strong>${esc(pet.name)}</strong><small>${esc(pet.breed||cap(pet.type))}</small></span>${icon(pet.id===activePet()?.id?'circle-check':'chevron-right')}</button>`).join('')}</div><button class="primary full" data-action="new-pet">${icon('plus')}Add a pet</button>`);
}
async function uploadPhoto(file) {
  if (!file || file.size>5*1024*1024)throw new Error('Choose an image smaller than 5 MB.');
  const link=URL.createObjectURL(file);let blob;
  try {
    const image=new Image();image.src=link;await image.decode();const canvas=document.createElement('canvas');const scale=Math.min(1,700/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.85));
  } catch {throw new Error('This photo could not be read. Try a JPEG, PNG, or WebP.');}finally{URL.revokeObjectURL(link);}
  if (!blob)throw new Error('Could not prepare the photo.');return (await api('/api/photos',{method:'POST',headers:{'Content-Type':'image/jpeg'},body:blob})).photo;
}
function petEditor(pet) {
  const record=pet||{id:id(),name:'',type:'dog',breed:'',weight:null,notes:'',photo:'',birthdate:''};
  modal(pet?'Edit pet profile':'Add a pet','PET PROFILES','paw-print',`<form id="pet-form">${field('Pet name','name',record.name,{required:true,length:80,placeholder:'Your pet’s name'})}<div class="form-grid">${select('Pet type','type',petTypes.map(type=>[type,cap(type)]),record.type)}${field('Breed','breed',record.breed,{length:120,placeholder:'Optional'})}</div><div class="form-grid">${field('Birthday','birthdate',record.birthdate,{type:'date',max:dayKey(0)})}${field('Weight (kg)','weight',pet?currentWeight(pet,state.logs):'',{type:'number',placeholder:'Optional'})}</div><label class="field"><span>Pet photo <small>Optional · 5 MB max</small></span><input type="file" name="photoFile" accept="image/jpeg,image/png,image/webp"></label>${record.photo?'<label class="check-label"><input name="removePhoto" type="checkbox">Remove current photo</label>':''}${notes(record.notes)}${formActions(pet?'Save profile':'Add pet',pet?'delete-pet':'')}</form>`);
  find('#pet-form').onsubmit=event=>{event.preventDefault();const data=values(event.target);save(async next=>{
    const weight=data.weight?Number(data.weight):null,photo=data.photoFile?.size?await uploadPhoto(data.photoFile):data.removePhoto?'':record.photo;
    const updated={...record,name:data.name,type:data.type,breed:data.breed,birthdate:data.birthdate,weight,photo,notes:data.notes};upsert(next.pets,updated);next.selectedPetId=record.id;
    if(pet&&weight&&weight!==currentWeight(pet,next.logs))next.logs.push({id:id(),petId:record.id,type:'weight',title:'Weight check-in',numericValue:weight,detail:`${weight} kg`,datetime:localDate().slice(0,16),notes:'',mood:''});
  },pet?'Pet profile updated':'Pet profile added');};
}
function editLog(type='feeding',record=null) {
  const pet=activePet();if(!pet)return showPets();
  const data=record||{id:id(),petId:pet.id,datetime:localDate().slice(0,16),title:'',detail:'',notes:'',mood:''};
  const mood=(data.mood||'').replace(/[^\p{L}\s]/gu,'').trim();
  modal(record?'Edit activity':types[type].action,`${pet.name}’S CARE JOURNAL`,types[type].icon,`<form id="log-form">${select('Activity type','type',Object.entries(types).map(([key,item])=>[key,item.name]),type)}<div id="log-fields"></div><div class="form-grid">${field('Date & time','datetime',data.datetime,{type:'datetime-local',required:true})}${select('Mood','mood',[['','Not recorded'],...new Set(['Happy','Playful','Calm','Sleepy','Anxious',...(mood?[mood]:[])])],mood)}</div>${notes(data.notes)}${formActions('Save activity',record?'delete-log':'')}</form>`);
  const form=find('#log-form');
  function dynamic(selected) {
    const details={feeding:['Meal','e.g. Breakfast kibble','Portion','e.g. 1 cup'],walk:['Activity or route','e.g. Riverside walk','Duration or distance','e.g. 30 minutes'],meds:['Medication','e.g. Monthly chew','Dose','e.g. 1 tablet'],grooming:['Care activity','e.g. Coat brushing','Details','e.g. 10 minutes']};
    const spec=details[selected];find('#log-fields').innerHTML=selected==='weight'?field('Weight (kg)','value',data.numericValue||'',{type:'number',required:true,placeholder:'e.g. 28.5'}):`${field(spec[0],'title',data.type===selected?data.title:'',{required:true,placeholder:spec[1]})}${field(spec[2],'detail',data.type===selected?data.detail:'',{length:300,placeholder:spec[3]})}`;
  }
  dynamic(type);form.elements.type.onchange=()=>dynamic(form.elements.type.value);
  form.onsubmit=event=>{event.preventDefault();const entry=values(form);save(next=>{
    const weight=entry.type==='weight'?Number(entry.value):null;
    upsert(next.logs,{...data,type:entry.type,title:weight?'Weight check-in':entry.title,detail:weight?`${weight} kg`:entry.detail,numericValue:weight,datetime:entry.datetime,mood:entry.mood,notes:entry.notes});
  },record?'Activity updated':'Activity logged');};
  if(record)form.querySelector('[data-action="delete-log"]').onclick=event=>{event.stopPropagation();confirmAction('Delete this activity?',`Remove “${record.title}” from the care journal.`,()=>save(next=>{next.logs=next.logs.filter(row=>row.id!==record.id);},'Activity deleted'));};
}
function editReminder(record) {
  const pet=activePet();if(!pet)return showPets();
  const data=record||{id:id(),petId:pet.id,title:'',category:'Vet visit',date:dayKey(1),notes:'',completed:false};
  modal(record?'Edit reminder':'Schedule care',`${pet.name}’S CARE PLANNER`,'calendar-days',`<form id="reminder-form">${field('Reminder title','title',data.title,{required:true,placeholder:'e.g. Annual wellness visit'})}<div class="form-grid">${select('Category','category',[...new Set([...categories,data.category])],data.category)}${field('Due date','date',data.date,{type:'date',required:true})}</div>${notes(data.notes)}<label class="check-label"><input name="completed" type="checkbox" ${data.completed?'checked':''}>Mark as completed</label>${formActions('Save reminder',record?'delete-reminder':'')}</form>`);
  const form=find('#reminder-form');form.onsubmit=event=>{event.preventDefault();const updated=values(form);save(next=>upsert(next.reminders,{...data,...updated,completed:!!updated.completed}),record?'Reminder updated':'Care scheduled');};
  if(record)form.querySelector('[data-action="delete-reminder"]').onclick=event=>{event.stopPropagation();confirmAction('Delete this reminder?',`Remove “${record.title}” from the schedule.`,()=>save(next=>{next.reminders=next.reminders.filter(row=>row.id!==record.id);},'Reminder deleted'));};
}
function settings() {
  const option=(action,svg,title,desc)=>`<button class="settings-option" data-action="${action}"><span class="modal-icon small">${icon(svg)}</span><span><strong>${title}</strong><small>${desc}</small></span>${icon('chevron-right')}</button>`;
  modal('Journal settings','YOUR WORKSPACE','settings',`<p class="dialog-copy">Your journal opens with this browser’s private cookie. Export a backup to move it to another device or browser.</p><div class="settings-options">${option('pets','paw-print','Manage pets','Switch profiles or add a companion')}${option('export','file-down','Export backup','Download your pets, photos, activities, and reminders')}${option('import','file-up','Restore backup','Replace this journal with a PawTrack JSON backup')}${option('reset','notebook-text','Restore sample journal','Start again with Barnaby and Mochi')}</div>`);
}
async function exportData() {
  await boot;if(!connected)throw new Error('Reconnect before exporting your journal.');
  const backup=structuredClone(state);
  for(const pet of backup.pets)if(pet.photo){const response=await fetch(pet.photo);if(!response.ok)throw new Error('A photo could not be included. Please retry.');const blob=await response.blob();pet.photo=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}
  const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=`pawtrack-${dayKey(0)}.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup downloaded');
}
find('#backup-file').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;
  try {
    if(file.size>32*1024*1024)throw new Error('Backups must be smaller than 32 MB.');
    const imported=JSON.parse(await file.text());if(!Array.isArray(imported.pets))throw new Error('Choose a PawTrack JSON backup.');
    const photos=[];
    for(const pet of imported.pets){if(!pet.type){pet.type=legacyType(pet.species);pet.breed=pet.breed||pet.species||'';}if(pet.photo){if(!/^data:image\/(jpeg|png|webp);base64,/.test(pet.photo))throw new Error('Backup contains an unsupported photo.');photos.push([pet,pet.photo]);pet.photo='';}}
    if(!validState(imported))throw new Error('This backup contains invalid records.');
    confirmAction('Restore this journal?',`This replaces your journal with ${imported.pets.length} pets, ${imported.logs.length} activities, and ${imported.reminders.length} reminders. Export first if you want to keep your current journal.`,()=>save(async next=>{for(const [pet,src] of photos){pet.photo=await uploadPhoto(await (await fetch(src)).blob());}Object.assign(next,imported);},'Journal restored'),'Restore backup',false);
  }catch(error){statusError(error instanceof SyntaxError?'This is not a valid JSON backup.':error.message);}
});
document.addEventListener('click',async event=>{
  const target=event.target.closest('[data-action]');if(!target||pending)return;
  const {action,id:recordId,type}=target.dataset;
  if (!connected && action!=='retry' && action!=='close') await boot;
  const pet=activePet();
  try {
    if(action==='close')dialog.close();
    if(action==='retry'){boot=load();await boot;}
    if(action==='pets')showPets();if(action==='new-pet')petEditor();if(action==='edit-pet'&&pet)petEditor(pet);
    if(action==='select-pet'){if(pet?.id===recordId)dialog.close();else await save(next=>{next.selectedPetId=recordId;},'Pet profile switched');}
    if(action==='delete-pet'&&pet)confirmAction(`Delete ${pet.name}’s profile?`,'This also removes their activities and reminders. This cannot be undone.',()=>save(next=>{next.pets=next.pets.filter(row=>row.id!==pet.id);next.logs=next.logs.filter(row=>row.petId!==pet.id);next.reminders=next.reminders.filter(row=>row.petId!==pet.id);next.selectedPetId=next.pets[0]?.id||null;},'Pet profile deleted'));
    if(action==='log')editLog(type||'feeding');if(action==='edit-log'){const record=state.logs.find(row=>row.id===recordId);if(record)editLog(record.type,record);}
    if(action==='reminder')editReminder();if(action==='edit-reminder')editReminder(state.reminders.find(row=>row.id===recordId));
    if(action==='toggle-reminder')await save(next=>{const row=next.reminders.find(item=>item.id===recordId);row.completed=!row.completed;},'Reminder updated',false);
    if(action==='filter'){filters[activeView()]=recordId;render();}if(action==='settings')settings();
    if(action==='export')await exportData();if(action==='import')find('#backup-file').click();
    if(action==='reset')confirmAction('Restore the sample journal?','Your current pets and all their records will be replaced. Export a backup first to keep them.',()=>save(next=>Object.assign(next,getDefaultData()),'Sample journal restored'),'Restore samples');
  }catch(error){statusError(error.message||'Something went wrong. Please try again.');}
});
dialog.addEventListener('click',event=>{if(event.target===dialog&&!pending){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();}});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
window.addEventListener('online',()=>{if(!connected)boot=load();});
window.addEventListener('offline',()=>{connected=false;banner('You’re offline. Reconnect to save changes.');});
document.addEventListener('error',event=>{const image=event.target;if(image instanceof HTMLImageElement&&image.getAttribute('src')?.startsWith('/.netlify/images?')){image.src=new URL(image.src).searchParams.get('url');}},true);
render();boot=load();
