export const types = {
  feeding: {name:'Meal', tag:'Feeding', icon:'meal', action:'Log a meal', hint:'Food & treats'},
  walk: {name:'Walk', tag:'Activity', icon:'footprints', action:'Log a walk', hint:'Walks & playtime'},
  meds: {name:'Medication', tag:'Medication', icon:'pill', action:'Log medication', hint:'Doses & supplements'},
  weight: {name:'Weight', tag:'Weight', icon:'weigh', action:'Log weight', hint:'Weight check-ins'},
  grooming: {name:'Wellness', tag:'Wellness', icon:'scissors', action:'Log wellness', hint:'Grooming & care'},
};
export const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const cap = value => value ? value[0].toUpperCase()+value.slice(1) : '';
export const icon = (name, extra='') => `<svg aria-hidden="true" class="ico ${extra}"><use href="/icons.svg#${name}"/></svg>`;
export const fmt = (value, options) => new Intl.DateTimeFormat(undefined, options).format(typeof value === 'string' && value.length === 10 ? new Date(`${value}T12:00`) : new Date(value));
export const localDate = (date = new Date()) => new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString();
export const dayKey = offset => { const date = new Date(); date.setDate(date.getDate()+offset); return localDate(date).slice(0,10); };
export const age = birth => {
  if (!birth) return '';
  const today = new Date(), born = new Date(`${birth}T12:00`);
  let months = (today.getFullYear()-born.getFullYear())*12 + today.getMonth()-born.getMonth() - Number(today.getDate()<born.getDate());
  months = Math.max(0, months);
  return months >= 12 ? `${Math.floor(months/12)} year${months>=24?'s':''} old` : months ? `${months} month${months===1?'':'s'} old` : 'Under 1 month';
};
export const dayLabel = value => value === dayKey(0) ? 'Today' : value === dayKey(-1) ? 'Yesterday' : fmt(value,{month:'short',day:'numeric',year:'numeric'});
export const currentWeight = (pet,logs) => logs.filter(row=>row.type==='weight' && row.petId===pet.id).sort((first,second)=>second.datetime.localeCompare(first.datetime))[0]?.numericValue ?? pet.weight;
export const animalPhoto = (pet,thumb=false) => pet.photo || (pet.id === 'pet-1' && pet.type === 'dog' ? `/.netlify/images?url=/img/${thumb?'barnaby-avatar':'barnaby'}.webp&w=${thumb?120:680}&fm=webp` : `/img/pets/${pet.type}.svg`);
export const petAvatar = pet => `<img class="pet-avatar" alt="" src="${esc(animalPhoto(pet,true))}">`;
export const sortedLogs = (state,pet) => state.logs.filter(row => row.petId===pet.id).sort((first,second)=>second.datetime.localeCompare(first.datetime));
export const sortedReminders = (state,pet) => state.reminders.filter(row=>row.petId===pet.id).sort((first,second)=>Number(first.completed)-Number(second.completed)||first.date.localeCompare(second.date));
export const empty = (title,description) => `<div class="empty"><span>${icon('paw-print')}</span><strong>${esc(title)}</strong><p>${esc(description)}</p></div>`;

export function navigation(view) {
  return [['overview','layout-grid','Overview'],['activity','notebook-text','Activity log'],['schedule','calendar-days','Schedule']].map(([id,svg,label])=>`<a href="#${id}" class="nav-item ${view===id?'active':''}" ${view===id?'aria-current="page"':''}>${icon(svg)}${label}</a>`).join('');
}

export function pageHeading(view,pet) {
  const title = view==='activity'?'Activity log':view==='schedule'?'Care schedule':'Care dashboard';
  return `<div class="page-heading"><div><div class="eyebrow"><i></i>YOUR WORKSPACE</div><h1>${title}<span class="title-dot">.</span></h1></div><div class="heading-right"><span class="today-date">${icon('calendar-days')}${esc(fmt(new Date(),{weekday:'short',month:'short',day:'numeric'}))}</span><button class="pet-switch" data-action="pets">${pet?petAvatar(pet):icon('paw-print')}Switch pet${icon('chevron-down')}</button></div></div>`;
}

export function hero(pet,logs) {
  const original = pet.id==='pet-1' && pet.type==='dog' && !pet.photo;
  const weight = currentWeight(pet,logs);
  return `<section class="hero" aria-label="Active pet profile"><div class="hero-art" aria-hidden="true"><img class="doodles" src="/img/hero-doodles.svg" alt=""><img class="pet-portrait ${original?'cutout':'other-portrait'}" src="${esc(animalPhoto(pet))}" alt="">${original?'<span class="woof">woof!</span>':''}</div><div class="hero-copy"><span class="profile-label"><span></span>ACTIVE PET PROFILE</span><h2>${esc(pet.name)}</h2><p class="breed">${esc(pet.breed||cap(pet.type))}${pet.breed?`<b>·</b>${esc(cap(pet.type))}`:''}</p><div class="pet-stats">${pet.birthdate?`<span>${icon('cake')}${esc(age(pet.birthdate))}</span>`:''}${weight?`<span>${icon('weigh')}${esc(weight)} kg</span>`:''}</div></div><button class="hero-edit" data-action="edit-pet">${icon('pencil')}<span>Edit profile</span></button></section>`;
}

export function quickLog(state,pet) {
  const today=dayKey(0), recent=state.logs.filter(row=>row.petId===pet.id && row.datetime.startsWith(today));
  const countLabel=(count,singular,plural)=>`${count} ${count===1?singular:plural} today`;
  const walks=recent.filter(row=>row.type==='walk'), minutes=walks.map(row=>(row.detail||'').match(/(\d+(?:\.\d+)?)\s*min/i));
  const weight=currentWeight(pet,state.logs);
  const summary={feeding:countLabel(recent.filter(row=>row.type==='feeding').length,'meal','meals'),walk:walks.length&&minutes.every(Boolean)?`${minutes.reduce((sum,match)=>sum+Number(match[1]),0)} minutes today`:countLabel(walks.length,'activity','activities'),meds:countLabel(recent.filter(row=>row.type==='meds').length,'dose','doses'),weight:weight?`Latest: ${weight} kg`:'No check-ins yet'};
  return `<section class="quick"><div class="section-line"><h2>Quick log</h2><span class="section-dash"></span><span class="section-hint">THE DAILY ESSENTIALS</span></div><div class="quick-grid">${Object.entries(types).slice(0,4).map(([type,item]) => `<button class="quick-card ${type}" data-action="log" data-type="${type}"><span class="quick-icon">${icon(item.icon)}</span><span class="quick-plus">${icon('plus')}</span><strong>${type==='walk'&&pet.type!=='dog'?'Log activity':item.action}</strong><small>${esc(summary[type])}</small>${icon(item.icon,'watermark')}</button>`).join('')}</div></section>`;
}

export function logList(rows) {
  if (!rows.length) return empty('No activities here yet','Use Quick log to record a care activity.');
  let previous = '';
  return `<div class="log-list">${rows.map(log=>{
    const item=types[log.type], day=log.datetime.slice(0,10);
    const heading=previous===day?'':`<div class="day-label"><span></span>${esc(dayLabel(day))}</div>`; previous=day;
    return `${heading}<button class="log-row" data-action="edit-log" data-id="${esc(log.id)}"><span class="kind-icon ${log.type}">${icon(item.icon)}</span><span class="entry-main"><strong>${esc(log.title)}</strong><small>${esc(log.detail||item.tag)}</small></span><span class="entry-time">${esc(fmt(log.datetime,{hour:'numeric',minute:'2-digit'}))}</span>${icon('chevron-right','row-arrow')}</button>`;
  }).join('')}</div>`;
}

export function reminderList(rows, full=false) {
  if (!rows.length) return empty('Nothing scheduled','Add a reminder for the next thing your pet needs.');
  return `<div class="reminder-list">${rows.map((row,index)=>{
    const diff=Math.round((new Date(`${row.date}T12:00`)-new Date(`${dayKey(0)}T12:00`))/86400000);
    const relative = row.completed?'Completed':diff<0?'Overdue':diff===0?'Due today':diff===1?'Tomorrow':`In ${diff} days`;
    const color=row.category==='Grooming'?'mint':row.category==='Medication'?'pink':index%2?'mint':'lilac';
    return `<div class="rem-row ${row.completed?'completed':''}"><button class="rem-main" data-action="edit-reminder" data-id="${esc(row.id)}"><span class="date-tile ${color}"><b>${esc(fmt(row.date,{month:'short'}))}</b><strong>${esc(fmt(row.date,{day:'numeric'}))}</strong></span><span class="entry-main"><strong>${esc(row.title)}</strong><small>${esc(row.category)}<span class="dot">·</span><span class="${diff<0&&!row.completed?'overdue':''}">${relative}</span></small></span></button>${full?`<button class="complete-btn ${row.completed?'done':''}" aria-label="${row.completed?'Mark incomplete':'Complete reminder'}" title="${row.completed?'Mark incomplete':'Complete reminder'}" data-action="toggle-reminder" data-id="${esc(row.id)}">${icon('check')}</button>`:''}</div>`;
  }).join('')}</div>`;
}

export function weightChart(state,pet) {
  const rows=sortedLogs(state,pet).filter(row=>row.type==='weight').reverse().slice(-12);
  if (rows.length < 2) return `<section class="panel weight-panel"><div class="panel-heading"><h2>${icon('chart-no-axes-combined')}Weight trend</h2><button class="text-btn" data-action="log" data-type="weight">Add weight ${icon('plus')}</button></div>${empty('A trend starts with two check-ins','Add weight entries to see changes over time.')}</section>`;
  const values=rows.map(row=>row.numericValue),min=Math.min(...values),max=Math.max(...values),range=(max-min)||1;
  const times = rows.map(row => new Date(row.datetime).getTime());
  const points=values.map((value,index)=>[20+(! (times.at(-1)-times[0]) ? index/(values.length-1) : (times[index]-times[0])/(times.at(-1)-times[0]))*940,72-(value-min)/range*50]);
  const line=points.map(point=>point.join(',')).join(' ');
  return `<section class="panel weight-panel"><div class="panel-heading"><h2>${icon('chart-no-axes-combined')}Weight trend</h2><button class="text-btn" data-action="log" data-type="weight">Add weight ${icon('plus')}</button></div><div class="chart-meta"><strong>${esc(values.at(-1))} <small>kg</small></strong><span>Latest check-in</span></div><svg class="chart" viewBox="0 0 980 98" preserveAspectRatio="none" role="img" aria-label="Weight changed from ${min} to a most recent value of ${values.at(-1)} kilograms"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e5d7fa"/><stop offset="1" stop-color="#fcfaff"/></linearGradient></defs><path d="M20 20h940M20 48h940M20 76h940" stroke="#eeeaf4" stroke-dasharray="5 5"/><polygon points="20,94 ${line} 960,94" fill="url(#chart-fill)"/><polyline points="${line}" fill="none" stroke="#9771d3" stroke-width="3" vector-effect="non-scaling-stroke"/>${points.map(([x,y],index)=>`<circle cx="${x}" cy="${y}" r="4" fill="#7650b8"><title>${esc(rows[index].datetime.slice(0,10))}: ${values[index]} kg</title></circle>`).join('')}</svg><div class="chart-labels"><span>${esc(fmt(rows[0].datetime,{month:'short',day:'numeric'}))}</span><span>${esc(fmt(rows.at(-1).datetime,{month:'short',day:'numeric'}))}</span></div></section>`;
}

export function overview(state,pet) {
  return `${hero(pet,state.logs)}${quickLog(state,pet)}<div class="panel-grid"><section class="panel"><div class="panel-heading"><h2><span class="panel-icon">${icon('notebook-text')}</span>Recent activity</h2><a class="text-btn" href="#activity">View all ${icon('arrow-right')}</a></div>${logList(sortedLogs(state,pet).slice(0,4))}</section><section class="panel schedule-panel"><div class="panel-heading"><h2><span class="panel-icon">${icon('calendar-days')}</span>Upcoming care</h2><button class="panel-add" data-action="reminder" aria-label="Add reminder">${icon('plus')}</button></div>${reminderList(sortedReminders(state,pet).filter(row=>!row.completed).slice(0,3))}<a class="schedule-link" href="#schedule">View schedule ${icon('arrow-right')}</a></section></div>${weightChart(state,pet)}`;
}

export function collection(view,state,pet,filter) {
  const logs=view==='activity';
  const filters=logs?[['all','All activities'],...Object.entries(types).map(([id,data])=>[id,data.tag])]:[['upcoming','Upcoming'],['completed','Completed'],['all','All reminders']];
  const list=logs?sortedLogs(state,pet).filter(row=>filter==='all'||row.type===filter):sortedReminders(state,pet).filter(row=>filter==='all'||row.completed===(filter==='completed'));
  return `<section class="panel collection"><div class="collection-heading"><div class="collection-pet">${petAvatar(pet)}<div><div class="eyebrow">${logs?'CARE JOURNAL':'CARE PLANNER'}</div><h2>${esc(pet.name)}’s ${logs?'activities':'reminders'}</h2></div></div><button class="primary" data-action="${logs?'log':'reminder'}">${icon('plus')}Add ${logs?'entry':'reminder'}</button></div><div class="filters" aria-label="Filter records">${filters.map(([id,label])=>`<button class="${filter===id?'on':''}" aria-pressed="${filter===id}" data-action="filter" data-id="${id}">${label}</button>`).join('')}</div>${logs?logList(list):reminderList(list,true)}</section>${logs?weightChart(state,pet):''}`;
}
