
import {
  createState, MEALS, KEYS, nutritionFor,
  sumNutrition, estimateEnergy, calculateMacros
} from './core.mjs';

import {
  readState, writeState, backupBlob, wipeState
} from './store.mjs';

import {SAMPLE_FOODS, SAMPLE_RECIPES} from './seed.mjs';

const app = document.querySelector('#app');
const tabs = ['Diario','Alimentos','Recetas','Actividad','Perfil','Datos'];
const today = new Date();
const iso = d => [
  d.getFullYear(),
  String(d.getMonth()+1).padStart(2,'0'),
  String(d.getDate()).padStart(2,'0')
].join('-');

let date = iso(today);
let tab = 'Diario';
let state, loadError = null;

try {
  state = readState();
} catch (error) {
  loadError = error.message;
  state = createState();
}

const h = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;',
  '"':'&quot;', "'":'&#39;'
}[c]));

const uid = () => crypto.randomUUID();
const foods = () => [...SAMPLE_FOODS, ...state.customFoods];
const food = id => foods().find(f => f.id === id);
const recipes = () => [...SAMPLE_RECIPES, ...state.customRecipes];
const fmt = (n, unit='') => n == null || !Number.isFinite(n)
  ? 'Sin dato' : `${Math.round(n*10)/10} ${unit}`.trim();

const clone = obj => JSON.parse(JSON.stringify(obj));

function save(change) {
  const old = clone(state);
  try {
    if (loadError) throw Error('Hay datos que necesitan recuperarse.');
    change();
    writeState(state);
    render();
  } catch(e) {
    state = old;
    alert(e.message || 'No se pudieron guardar los cambios.');
  }
}

function mealItems(meal) {
  return state.diary[date]?.[meal] || [];
}

function allItems() {
  return MEALS.flatMap(meal => mealItems(meal));
}

function metrics(items) {
  const v = items.length ? sumNutrition(items).values : {};
  return `<div class="stats">
    <div class="stat"><small>Calorías</small><strong>${fmt(v.kcal ?? (items.length ? null : 0),'kcal')}</strong></div>
    <div class="stat"><small>Proteínas</small><strong>${fmt(v.protein ?? (items.length ? null : 0),'g')}</strong></div>
    <div class="stat"><small>Carbohidratos</small><strong>${fmt(v.carbs ?? (items.length ? null : 0),'g')}</strong></div>
    <div class="stat"><small>Grasas</small><strong>${fmt(v.fat ?? (items.length ? null : 0),'g')}</strong></div>
  </div>`;
}

function mealOptions() {
  return MEALS.map(m => `<option value="${m}">${m[0].toUpperCase()+m.slice(1)}</option>`).join('');
}

function foodOptions() {
  return foods().map(f =>
    `<option value="${h(f.id)}">${h(f.name)}</option>`
  ).join('');
}

function diario() {
  return `
    <div class="card green">
      <h1>Mi diario de alimentación</h1>
      <p>Registra tus comidas a tu ritmo, sin restricciones obligatorias.</p>
      <label for="dia">Seleccionar fecha</label>
      <input id="dia" type="date" value="${date}">
    </div>
    <div class="card"><h2>Resumen del día</h2>${metrics(allItems())}</div>
    <div class="card">
      <h2>Añadir alimento</h2>
      <form data-form="add">
        <div class="field"><label>Comida</label>
          <select name="meal">${mealOptions()}</select>
        </div>
        <div class="field"><label>Alimento</label>
          <select name="food">${foodOptions()}</select>
        </div>
        <div class="grid">
          <div class="field"><label>Cantidad</label>
            <input name="quantity" type="number" min="0.01"
              step="any" value="100" required>
          </div>
          <div class="field"><label>Unidad</label>
            <select name="unit">
              <option value="g">Gramos</option>
              <option value="kg">Kilogramos</option>
              <option value="ml">Mililitros</option>
              <option value="l">Litros</option>
              <option value="unidad">Unidades</option>
            </select>
          </div>
        </div>
        <button class="btn" type="submit">Añadir al diario</button>
      </form>
    </div>
    ${MEALS.map(m => `
      <div class="card">
        <div class="row between">
          <h2>${m[0].toUpperCase()+m.slice(1)}</h2>
          <button class="btn secondary small" data-do="saveMeal" data-meal="${m}">
            Guardar comida
          </button>
        </div>
        ${metrics(mealItems(m))}
        ${mealItems(m).length ? mealItems(m).map(item => `
          <div class="item row between">
            <div><strong>${h(item.food.name)}</strong>
              <div class="muted">${fmt(item.quantity)} ${h(item.unit)} ·
              ${fmt(nutritionFor(item.food,item.quantity,item.unit).kcal,'kcal')}</div>
            </div>
            <div class="actions">
              <button class="btn secondary small" data-do="edit" data-meal="${m}" data-id="${h(item.id)}">Editar</button>
              <button class="btn danger small" data-do="remove" data-meal="${m}" data-id="${h(item.id)}">Eliminar</button>
            </div>
          </div>`).join('') : '<p class="muted">Sin alimentos registrados.</p>'}
      </div>`).join('')}
    <div class="card">
      <h2>Comidas guardadas</h2>
      ${state.savedMeals.length ? state.savedMeals.map(s => `
        <div class="item row between">
          <div><strong>${h(s.name)}</strong>
            <div class="muted">${s.items.length} alimentos</div>
          </div>
          <div class="actions">
            <button class="btn secondary small" data-do="repeat" data-id="${h(s.id)}">Reutilizar</button>
            <button class="btn danger small" data-do="deleteMeal" data-id="${h(s.id)}">Eliminar</button>
          </div>
        </div>`).join('') : '<p class="muted">Todavía no hay comidas guardadas.</p>'}
    </div>`;
}

function alimentos() {
  return `<div class="card">
    <h1>Buscar alimentos</h1>
    <p>Base inicial de ejemplo. Los valores son orientativos, no verificados.</p>
    <input id="search" type="search" placeholder="Buscar por nombre...">
  </div>
  <div class="card">
    <h2>Crear alimento personalizado</h2>
    <form data-form="food">
      <div class="field"><label>Nombre</label>
        <input name="name" required maxlength="100"></div>
      <div class="grid">
        <div class="field"><label>Unidad base</label>
          <select name="base">
            <option value="g">Gramos</option>
            <option value="ml">Mililitros</option>
            <option value="unidad">Unidad</option>
          </select></div>
        <div class="field"><label>Valores por cantidad</label>
          <input name="per" type="number" min="0.01" step="any" value="100" required>
        </div>
      </div>
      <div class="grid">
        ${[['kcal','Calorías (kcal)'],['protein','Proteínas (g)'],
          ['carbs','Carbohidratos (g)'],['fat','Grasas (g)'],
          ['sugar','Azúcares (g)'],['fiber','Fibra (g)']].map(([k,l]) =>
          `<div class="field"><label>${l}</label>
          <input name="${k}" type="number" min="0" step="any"
           placeholder="Desconocido"></div>`
        ).join('')}
      </div>
      <button class="btn">Guardar alimento</button>
    </form>
  </div>
  <div class="card">
    <h2>Alimentos disponibles</h2>
    ${foods().map(f => `
      <div class="item" data-food-item="${h(f.name.toLowerCase())}">
        <div class="row between">
          <strong>${h(f.name)}</strong>
          <span class="badge">${f.source === 'ejemplo' ? 'Ejemplo' : 'Personalizado'}</span>
        </div>
        <p class="muted">Por ${fmt(f.per)} ${h(f.baseUnit)}:
          ${fmt(f.nutrition.kcal,'kcal')} ·
          P ${fmt(f.nutrition.protein,'g')} ·
          HC ${fmt(f.nutrition.carbs,'g')} ·
          G ${fmt(f.nutrition.fat,'g')} ·
          Azúcares ${fmt(f.nutrition.sugar,'g')}</p>
        <div class="actions">
          <button class="btn secondary small" data-do="fav" data-id="${h(f.id)}">
            ${state.foodFavorites.includes(f.id) ? 'Quitar favorito' : '☆ Favorito'}
          </button>
          ${f.source === 'usuario' ?
            `<button class="btn danger small" data-do="deleteFood" data-id="${h(f.id)}">Eliminar</button>` : ''}
        </div>
      </div>`).join('')}
  </div>`;
}

function recetas() {
  return `<div class="card green">
    <h1>Recetas rápidas y económicas</h1>
    <p>Ideas orientativas con ingredientes y cantidades.</p>
  </div>
  ${recipes().map(r => {
    const result = sumNutrition(r.ingredients).values;
    return `<div class="card">
      <div class="row between"><h2>${h(r.title)}</h2>
        <span class="badge">${r.minutes} minutos</span></div>
      <p class="muted">${r.servings} raciones ·
        ${fmt(result.kcal == null ? null : result.kcal/r.servings,'kcal por ración')}</p>
      <h3>Ingredientes</h3>
      ${r.ingredients.map(i => `<div class="item">
        ${h(i.food.name)} — ${fmt(i.quantity)} ${h(i.unit)}
      </div>`).join('')}
      <h3 style="margin-top:15px">Preparación</h3>
      <p style="white-space:pre-line">${h(r.steps)}</p>
      <div class="actions">
        <button class="btn" data-do="recipe" data-id="${h(r.id)}">Añadir al diario</button>
        <button class="btn secondary" data-do="recipeFav" data-id="${h(r.id)}">
          ${state.recipeFavorites.includes(r.id) ? '★ Favorita' : '☆ Guardar favorita'}
        </button>
      </div>
    </div>`;
  }).join('')}`;
}

function actividad() {
  return `<div class="card green">
    <h1>Mi actividad y progreso</h1>
    <p>Registra pasos, entrenamientos y peso. El conteo de pasos es manual por ahora.</p>
  </div>
  <div class="grid">
    <div class="card">
      <h2>Pasos diarios</h2>
      <form data-form="steps">
        <label>Fecha</label><input type="date" name="date" value="${date}" required>
        <label>Pasos</label><input type="number" name="steps" min="0" step="1" required>
        <button class="btn" style="margin-top:12px">Guardar pasos</button>
      </form>
    </div>
    <div class="card">
      <h2>Registro de peso</h2>
      <form data-form="weight">
        <label>Fecha</label><input type="date" name="date" value="${date}" required>
        <label>Peso (kg)</label><input type="number" name="weight" min="1" max="600" step="0.1" required>
        <button class="btn" style="margin-top:12px">Guardar peso</button>
      </form>
    </div>
  </div>
  <div class="card">
    <h2>Entrenamientos</h2>
    <form data-form="workout">
      <div class="grid">
        <div class="field"><label>Actividad</label>
          <input name="name" required maxlength="100" placeholder="Ej.: caminar, gimnasio"></div>
        <div class="field"><label>Duración (minutos)</label>
          <input name="minutes" type="number" min="1" max="1440" required></div>
      </div>
      <button class="btn">Guardar entrenamiento</button>
    </form>
    ${state.workouts.map(w => `<div class="item row between">
      <span>${h(w.date)} · ${h(w.name)} · ${fmt(w.minutes)} min</span>
      <button class="btn danger small" data-do="removeWorkout" data-id="${h(w.id)}">Eliminar</button>
    </div>`).join('')}
  </div>
  <div class="grid">
    <div class="card"><h2>Historial de pasos</h2>
      ${state.stepsLog.map(x => `<div class="item">${h(x.date)} · ${fmt(x.steps)} pasos</div>`).join('') || '<p class="muted">Sin registros.</p>'}
    </div>
    <div class="card"><h2>Historial de peso</h2>
      ${state.weightLog.map(x => `<div class="item">${h(x.date)} · ${fmt(x.weight)} kg</div>`).join('') || '<p class="muted">Sin registros.</p>'}
    </div>
  </div>`;
}

function perfil() {
  const p = state.profile;
  const energy = estimateEnergy(p);
  const goalFactor = p.objective === 'perder' ? .9 : p.objective === 'ganar' ? 1.1 : 1;
  const target = energy ? Math.round(energy.maintenance*goalFactor) : null;
  let macro = null;
  try {
    if(target) macro=calculateMacros(target,{
      protein:p.proteinPercent,carbs:p.carbsPercent,fat:p.fatPercent
    });
  } catch(e) {}

  return `<div class="card green">
    <h1>Mi perfil y objetivos</h1>
    <p>Las necesidades nutricionales son estimaciones, no límites obligatorios.</p>
    ${energy ? `<h2>Mantenimiento estimado: ${energy.maintenance} kcal/día</h2>
      <p>Referencia orientativa según tu objetivo: ${target} kcal/día.</p>
      ${macro ? `<p>Proteínas: ${macro.protein} g ·
        Carbohidratos: ${macro.carbs} g · Grasas: ${macro.fat} g</p>` : ''}` :
      '<p>Completa los datos para obtener una estimación para adultos.</p>'}
  </div>
  <div class="card">
    <form data-form="profile">
      <div class="grid">
        ${[['name','Nombre','text'],['age','Edad','number'],
          ['weight','Peso (kg)','number'],['height','Altura (cm)','number']].map(([key,label,type]) =>
          `<div class="field"><label>${label}</label>
            <input name="${key}" type="${type}" value="${h(p[key] ?? '')}"
             ${type==='number' ? 'min="1" step="any"' : 'maxlength="100"'}></div>`
        ).join('')}
        <div class="field"><label>Sexo usado para la estimación</label>
          <select name="sex">
            ${[['','Prefiero no indicarlo'],['hombre','Hombre'],['mujer','Mujer']].map(([v,l]) =>
              `<option value="${v}" ${p.sex===v?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Actividad habitual</label>
          <select name="activity">
            ${[['sedentario','Sedentario'],['ligero','Ligeramente activo'],
              ['medio','Actividad media'],['muy_activo','Muy activo']].map(([v,l]) =>
              `<option value="${v}" ${p.activity===v?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Mi objetivo</label>
          <select name="objective">
            ${[['mantener','Mantener peso'],['perder','Reducir peso'],
              ['ganar','Ganar peso o masa muscular']].map(([v,l]) =>
              `<option value="${v}" ${p.objective===v?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>
      <h3>Reparto de macronutrientes (%)</h3>
      <div class="grid three">
        ${[['proteinPercent','Proteínas'],['carbsPercent','Carbohidratos'],['fatPercent','Grasas']].map(([k,l]) =>
          `<div class="field"><label>${l}</label>
            <input type="number" min="0" max="100" step="1" name="${k}" value="${p[k]}" required>
          </div>`).join('')}
      </div>
      <button class="btn">Guardar perfil</button>
    </form>
    <p class="muted" style="margin-top:15px">Las referencias de reducción o aumento del 10% solo se muestran para adultos. No sustituyen el asesoramiento profesional.</p>
  </div>`;
}

function datos() {
  return `<div class="card">
    <h1>Mis datos y privacidad</h1>
    <p>NutriIA guarda la información localmente en este navegador.</p>
    <p>No hay cuentas ni sincronización entre dispositivos en esta versión.</p>
    <div class="actions">
      <button class="btn" data-do="export">Exportar mis datos</button>
      <button class="btn danger" data-do="wipe">Borrar mis datos</button>
    </div>
  </div>
  <div class="card">
    <h2>Aprende sobre nutrición</h2>
    <p>Las proteínas ayudan al mantenimiento de los tejidos. Los carbohidratos aportan energía y las grasas desempeñan funciones esenciales.</p>
    <p>Vitaminas y minerales son micronutrientes importantes. Si un alimento no incluye un valor, lo mostramos como desconocido.</p>
    <p>Una alimentación variada y flexible no necesita clasificar los alimentos como buenos o malos.</p>
  </div>`;
}

function render() {
  if (loadError) {
    app.innerHTML = `<main class="container"><div class="card error">
      <h2>No se han podido leer los datos guardados</h2>
      <p>${h(loadError)}</p>
      <p>No se borrarán ni sobrescribirán automáticamente.</p>
    </div></main>`;
    return;
  }

  const screens = {
    Diario:diario, Alimentos:alimentos, Recetas:recetas,
    Actividad:actividad, Perfil:perfil, Datos:datos
  };

  app.innerHTML = `
    <header class="app-header"><div class="header-inner">
      <div><div class="brand">🌿 NutriIA</div>
      <div class="subtitle">Tu nutrición, a tu ritmo</div></div>
      <span class="badge">Versión local gratuita</span>
    </div></header>
    <nav class="tabs" aria-label="Navegación principal">
      ${tabs.map(t => `<button data-tab="${t}" class="tab ${tab===t?'active':''}">${t}</button>`).join('')}
    </nav>
    <main class="container">${screens[tab]()}</main>`;
}

app.addEventListener('click', event => {
  const b = event.target.closest('button');
  if (!b) return;

  if (b.dataset.tab) {
    tab = b.dataset.tab;
    render();
    return;
  }

  const action = b.dataset.do;
  const id = b.dataset.id;

  if (!action) return;

  try {
    if (action === 'edit') {
      const item = mealItems(b.dataset.meal).find(i=>i.id===id);
      if(!item) return;
      const text=prompt('Nueva cantidad:',item.quantity);
      if(text===null) return;
      const quantity=Number(text);
      nutritionFor(item.food,quantity,item.unit);
      save(()=>{item.quantity=quantity;});
    }

    if(action==='remove' && confirm('¿Eliminar alimento del diario?'))
      save(()=>{state.diary[date][b.dataset.meal]=mealItems(b.dataset.meal).filter(i=>i.id!==id);});

    if(action==='fav') save(()=>{
      state.foodFavorites=state.foodFavorites.includes(id)
        ? state.foodFavorites.filter(x=>x!==id)
        : [...state.foodFavorites,id];
    });

    if(action==='deleteFood' && confirm('¿Eliminar este alimento personalizado?'))
      save(()=>{state.customFoods=state.customFoods.filter(f=>f.id!==id);});

    if(action==='saveMeal') {
      const items=mealItems(b.dataset.meal);
      if(!items.length) return alert('Esta comida no tiene alimentos.');
      const name=prompt('Nombre para guardar la comida:');
      if(!name?.trim()) return;
      save(()=>state.savedMeals.push({
        id:uid(),name:name.trim(),items:clone(items)
      }));
    }

    if(action==='repeat') {
      const meal=state.savedMeals.find(s=>s.id===id);
      const target=prompt('¿En qué comida? desayuno, comida, merienda o cena','comida')?.toLowerCase();
      if(!meal || !MEALS.includes(target)) return;
      save(()=>{
        state.diary[date] ||= {};
        state.diary[date][target] ||= [];
        state.diary[date][target].push(...clone(meal.items).map(x=>({...x,id:uid()})));
      });
    }

    if(action==='deleteMeal' && confirm('¿Eliminar comida guardada?'))
      save(()=>{state.savedMeals=state.savedMeals.filter(s=>s.id!==id);});

    if(action==='recipeFav') save(()=>{
      state.recipeFavorites=state.recipeFavorites.includes(id)
        ? state.recipeFavorites.filter(x=>x!==id)
        : [...state.recipeFavorites,id];
    });

    if(action==='recipe') {
      const recipe=recipes().find(r=>r.id===id);
      if(!recipe) return;
      const meal=prompt('¿En qué comida? desayuno, comida, merienda o cena','comida')?.toLowerCase();
      if(!MEALS.includes(meal)) return;
      const portion=Number(prompt('Número de raciones que has comido:',1));
      if(!Number.isFinite(portion)||portion<=0) return alert('Cantidad inválida.');

      const total=sumNutrition(recipe.ingredients).values;
      const nutrition=Object.fromEntries(KEYS.map(k=>
        [k,total[k]===null?null:total[k]/recipe.servings]
      ));
      save(()=>{
        state.diary[date] ||= {};
        state.diary[date][meal] ||= [];
        state.diary[date][meal].push({
          id:uid(),quantity:portion,unit:'unidad',
          food:{id:'recipe-'+uid(),name:recipe.title,
            baseUnit:'unidad',per:1,source:'receta',nutrition}
        });
      });
    }

    if(action==='removeWorkout' && confirm('¿Eliminar entrenamiento?'))
      save(()=>{state.workouts=state.workouts.filter(w=>w.id!==id);});

    if(action==='export') {
      const url=URL.createObjectURL(backupBlob(state));
      const link=document.createElement('a');
      link.href=url;
      link.download=`NutriIA-copia-${date}.json`;
      link.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }

    if(action==='wipe' &&
       confirm('¿Borrar todos tus datos de este navegador?') &&
       confirm('Esta acción no se puede deshacer. ¿Continuar?')) {
      wipeState();
      state=createState();
      render();
    }
  } catch(e) { alert(e.message); }
});

app.addEventListener('change',event=>{
  if(event.target.id==='dia') {
    date=event.target.value;
    render();
  }

  if(event.target.name==='food') {
    const f=food(event.target.value);
    const form=event.target.closest('form');
    if(f && form) {
      form.elements.unit.value=f.baseUnit;
      form.elements.quantity.value=f.baseUnit==='unidad'?1:100;
    }
  }
});

app.addEventListener('input',event=>{
  if(event.target.id==='search') {
    const q=event.target.value.trim().toLowerCase();
    document.querySelectorAll('[data-food-item]').forEach(el=>{
      el.hidden=!el.dataset.foodItem.includes(q);
    });
  }
});

app.addEventListener('submit',event=>{
  const form=event.target;
  if(!form.dataset.form) return;
  event.preventDefault();

  const v=Object.fromEntries(new FormData(form));
  const number=(s,min=0)=> {
    if(s==='' || !Number.isFinite(Number(s)) || Number(s)<min)
      throw Error('Introduce un número válido.');
    return Number(s);
  };

  try {
    switch(form.dataset.form) {
      case 'add': {
        const f=food(v.food);
        if(!f || !MEALS.includes(v.meal)) throw Error('Alimento o comida no válidos.');
        const quantity=number(v.quantity,0.001);
        nutritionFor(f,quantity,v.unit);
        save(()=>{
          state.diary[date] ||= {};
          state.diary[date][v.meal] ||= [];
          state.diary[date][v.meal].push({
            id:uid(),food:clone(f),quantity,unit:v.unit
          });
        });
        break;
      }

      case 'food': {
        const name=v.name.trim();
        if(!name) throw Error('Escribe un nombre.');
        if(foods().some(f=>f.name.toLowerCase()===name.toLowerCase()))
          throw Error('Ya existe un alimento con ese nombre.');
        const nutrition=Object.fromEntries(KEYS.map(k=>
          [k,v[k]==null || v[k]===''?null:number(v[k])]
        ));
        save(()=>state.customFoods.push({
          id:uid(),name,baseUnit:v.base,per:number(v.per,0.001),
          source:'usuario',nutrition
        }));
        break;
      }

      case 'steps':
        save(()=>{
          const record={date:v.date,steps:number(v.steps)};
          state.stepsLog=state.stepsLog.filter(x=>x.date!==v.date);
          state.stepsLog.push(record);
          state.stepsLog.sort((a,b)=>b.date.localeCompare(a.date));
        });
        break;

      case 'weight':
        save(()=>{
          const record={date:v.date,weight:number(v.weight,1)};
          state.weightLog=state.weightLog.filter(x=>x.date!==v.date);
          state.weightLog.push(record);
          state.weightLog.sort((a,b)=>b.date.localeCompare(a.date));
        });
        break;

      case 'workout':
        save(()=>state.workouts.unshift({
          id:uid(),date, name:v.name.trim(),
          minutes:number(v.minutes,1)
        }));
        break;

      case 'profile': {
        const total=number(v.proteinPercent)+number(v.carbsPercent)+number(v.fatPercent);
        if(Math.abs(total-100)>0.01)
          throw Error('Los porcentajes de macros deben sumar 100.');
        save(()=>{
          state.profile={
            ...state.profile,
            name:v.name.trim(),
            age:v.age===''?null:number(v.age,1),
            weight:v.weight===''?null:number(v.weight,1),
            height:v.height===''?null:number(v.height,1),
            sex:v.sex,activity:v.activity,objective:v.objective,
            proteinPercent:number(v.proteinPercent),
            carbsPercent:number(v.carbsPercent),
            fatPercent:number(v.fatPercent)
          };
        });
        break;
      }
    }
  } catch(e) { alert(e.message); }
});

render();
