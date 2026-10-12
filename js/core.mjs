export const MEALS = [
  { id: 'desayuno', label: 'Desayuno', icon: '☀️' },
  { id: 'comida', label: 'Comida', icon: '🍽️' },
  { id: 'merienda', label: 'Merienda', icon: '🍎' },
  { id: 'cena', label: 'Cena', icon: '🌙' }
];
export const KEYS = ['kcal', 'protein', 'carbs', 'fat', 'sugar', 'fiber', 'saturates', 'sodium', 'calcium', 'iron', 'potassium', 'vitaminC', 'magnesium', 'phosphorus', 'zinc', 'vitaminA', 'vitaminD', 'vitaminE', 'vitaminB6', 'vitaminB12', 'folate'];
export const MICRO_KEYS = ['sugar', 'fiber', 'saturates', 'sodium', 'calcium', 'iron', 'potassium', 'vitaminC', 'magnesium', 'phosphorus', 'zinc', 'vitaminA', 'vitaminD', 'vitaminE', 'vitaminB6', 'vitaminB12', 'folate'];
export const NUTRIENT_UNITS = {kcal:'kcal',protein:'g',carbs:'g',fat:'g',sugar:'g',fiber:'g',saturates:'g',sodium:'mg',calcium:'mg',iron:'mg',potassium:'mg',vitaminC:'mg',magnesium:'mg',phosphorus:'mg',zinc:'mg',vitaminA:'µg',vitaminD:'µg',vitaminE:'mg',vitaminB6:'mg',vitaminB12:'µg',folate:'µg'};
export const LABELS = {kcal:'Calorías',protein:'Proteínas',carbs:'Carbohidratos',fat:'Grasas',sugar:'Azúcares',fiber:'Fibra',saturates:'Grasas saturadas',sodium:'Sodio',calcium:'Calcio',iron:'Hierro',potassium:'Potasio',vitaminC:'Vitamina C',magnesium:'Magnesio',phosphorus:'Fósforo',zinc:'Zinc',vitaminA:'Vitamina A',vitaminD:'Vitamina D',vitaminE:'Vitamina E',vitaminB6:'Vitamina B6',vitaminB12:'Vitamina B12',folate:'Folato'};
export const UNIT_LABELS = {g:'g',kg:'kg',ml:'ml',l:'l',unidad:'unidad',racion:'ración'};
export const MAX_QUANTITY = 100000;
export const todayISO = (date=new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function shiftDate(iso, offset){
  const [y,m,d] = iso.split('-').map(Number); const dt = new Date(Date.UTC(y,m-1,d+offset)); return dt.toISOString().slice(0,10);
}
export const uid = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function parseNumber(value, {allowZero=false, max=MAX_QUANTITY}={}) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const str=String(value).trim().replace(',','.');
  if (!/^[+]?(?:\d+\.?\d*|\.\d+)$/.test(str)) return null;
  const n=Number(str); return Number.isFinite(n) && (allowZero?n>=0:n>0) && n<=max ? n:null;
}
export function allowedUnits(food){
  switch(food.baseUnit){case 'g':return ['g','kg',...(food.gramsPerUnit ? ['unidad']:[])];case 'ml':return ['ml','l'];case 'unidad':return ['unidad'];case 'racion':return ['racion'];default:return []}
}
export function factor(food,quantity,unit){
  const n=parseNumber(quantity); if(n===null || !allowedUnits(food).includes(unit)) throw new Error('Cantidad o unidad no válida para este alimento.');
  let amount=n;
  if(unit==='kg'||unit==='l') amount=n*1000;
  if(unit==='unidad'&&food.baseUnit==='g') amount=n*food.gramsPerUnit;
  return amount/food.per;
}
export function scaleNutrition(food,quantity,unit){
  const f=factor(food,quantity,unit); const out={};
  for(const k of KEYS){const v=food.nutrition?.[k];out[k]=typeof v==='number' && Number.isFinite(v) && v>=0 ? v*f : null;} return out;
}
export function sumNutrition(items){
  const result={};for(const k of KEYS) result[k]={value:0,missing:0,known:0};
  for(const n of items){for(const k of KEYS){if(n?.[k]===null || n?.[k]===undefined || !Number.isFinite(n[k])) result[k].missing++;else {result[k].value+=n[k];result[k].known++;}}}
  return result;
}
export function totalsForEntries(entries){return sumNutrition(entries.map(e=>scaleNutrition(e.food,e.quantity,e.unit)));}
export function recipeNutrition(recipe){
  const total=totalsForEntries(recipe.ingredients);
  const per={}; for(const k of KEYS) per[k]={value:total[k].value/recipe.servings,missing:total[k].missing,known:total[k].known};
  return {total,per};
}
export function nutritionPerServingFood(recipe, servings=recipe.servings){
  const total=totalsForEntries(recipe.ingredients);
  const nutrients={}; for(const k of KEYS) nutrients[k]=total[k].missing ? null : total[k].value/servings;
  return {id:`recipe:${recipe.id}`,name:recipe.title,baseUnit:'racion',per:1,nutrition:nutrients,source:'receta'};
}
export function createEntry(food,quantity,unit){factor(food,quantity,unit);return {id:uid(),food:structuredClone(food),quantity:Number(String(quantity).replace(',','.')),unit};}
export function createState(){return {version:2,customFoods:[],customRecipes:[],favourites:{foods:[],recipes:[]},diary:{},savedMeals:[],weightLog:[],stepsLog:[],workouts:[],profile:{name:'',age:'',weight:'',height:'',sex:'',activity:'1.375',goal:'mantener',macroProtein:25,macroCarbs:45,macroFat:30}};}
export function dayMeals(state,date){return state.diary[date] ?? Object.fromEntries(MEALS.map(m=>[m.id,[]]));}
export function ensureDay(state,date){state.diary[date]??={};for(const m of MEALS) state.diary[date][m.id]??=[];return state.diary[date];}
export function addEntry(state,date,meal,entry){if(!MEALS.some(m=>m.id===meal)) throw Error('Comida inválida');ensureDay(state,date)[meal].push(entry);}
export function duplicateEntryFound(entries,entry){return entries.some(e=> e.food.id===entry.food.id && e.quantity===entry.quantity && e.unit===entry.unit);}
export function createSavedMeal(name,entries){if(!name?.trim() || !entries.length)throw Error('La comida debe tener un nombre y alimentos.');return {id:uid(),name:name.trim(),items:entries.map(e=>createEntry(e.food,e.quantity,e.unit))};}
export function applySavedMeal(state,template,date,meal){if(!template.items.length)throw Error('Comida guardada vacía.');const items=template.items.map(e=>createEntry(e.food,e.quantity,e.unit)); for(const e of items)addEntry(state,date,meal,e);return items;}
export function approximateMaintenance(p){
  const age=parseNumber(p.age,{max:120}), weight=parseNumber(p.weight,{max:500}),height=parseNumber(p.height,{max:250}), activity=Number(p.activity);
  if(age===null || age<18 || weight===null || height===null || !['male','female'].includes(p.sex) || ![1.2,1.375,1.55,1.725].includes(activity)) return null;
  const bmr=10*weight+6.25*height-5*age+(p.sex==='male'?5:-161);
  return Math.round(bmr*activity);
}
export function safeText(str){return String(str??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export const validId=x=>typeof x==='string'&&/^[\w:.-]{1,120}$/.test(x);
export function validateFood(f){
  if(!f || !validId(f.id)||typeof f.name!=='string'||!f.name.trim()||f.name.length>140||!['g','ml','unidad','racion'].includes(f.baseUnit)||f.per!==(f.baseUnit==='g'||f.baseUnit==='ml'?100:1)||!f.nutrition) return false;
  return KEYS.every(k=> f.nutrition[k]==null || (typeof f.nutrition[k]==='number'&&Number.isFinite(f.nutrition[k])&&f.nutrition[k]>=0&&f.nutrition[k]<=100000)) && (!f.gramsPerUnit || parseNumber(f.gramsPerUnit)!==null);
}
export function validateState(s){
  if(!s || s.version!==2 || !Array.isArray(s.stepsLog)||!Array.isArray(s.workouts)||!Array.isArray(s.customFoods)||!Array.isArray(s.customRecipes)||!Array.isArray(s.savedMeals)||!Array.isArray(s.weightLog)||!s.favourites||!Array.isArray(s.favourites.foods)||!Array.isArray(s.favourites.recipes)||!s.profile||!s.diary||typeof s.diary!=='object')return false;
  if(s.customFoods.length>2000||s.customRecipes.length>2000||s.savedMeals.length>2000||s.stepsLog.length>20000||s.workouts.length>20000||s.weightLog.length>20000 || Object.keys(s.diary).length>36500) return false;
  if(!s.customFoods.every(validateFood))return false;
  const validEntry=e=>e&&validId(e.id)&&validateFood(e.food)&&parseNumber(e.quantity)!==null&&allowedUnits(e.food).includes(e.unit);
  if(!Object.entries(s.diary).every(([date,day])=> /^\d{4}-\d{2}-\d{2}$/.test(date)&&day&&MEALS.every(m=>Array.isArray(day[m.id])&&day[m.id].length<1000&&day[m.id].every(validEntry))))return false;
  if(!s.savedMeals.every(x=>x&&validId(x.id)&&typeof x.name==='string'&&Array.isArray(x.items)&&x.items.every(validEntry)))return false;
  if(!s.customRecipes.every(r=>r&&validId(r.id)&&typeof r.title==='string'&&typeof r.steps==='string'&&parseNumber(r.servings)!==null&&Array.isArray(r.ingredients)&&r.ingredients.every(validEntry)))return false;
  if(!s.stepsLog.every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x?.date)&&Number.isInteger(x.steps)&&x.steps>=0&&x.steps<=200000)) return false;
  if(!s.workouts.every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x?.date)&&validId(x.id)&&typeof x.type==='string'&&x.type.length<=140&&parseNumber(x.minutes,{max:1440})!==null&&typeof x.note==='string'&&x.note.length<=2000))return false;
  if(!s.weightLog.every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x?.date)&&parseNumber(x.weight,{max:500})!==null))return false;
  return true;
}
export const fmt=(value,digits=1)=>Number(value).toLocaleString('es-ES',{maximumFractionDigits:digits,minimumFractionDigits:0});
export function prettyMacro(record, key, digits=1){const x=record[key];if(!x)return '—';const val=fmt(x.value,digits)+' '+(NUTRIENT_UNITS[key]||'');return x.missing ? `${val} · parcial` : val;}
