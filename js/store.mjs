import {createState,validateState,KEYS} from './core.mjs';
export const STORAGE_KEY='nutriia-local-v2';
const OLD_KEY='nutriia-local-v1';
export function migrate(raw){
  if(!raw || typeof raw!=='object')throw Error('Copia de seguridad no válida.');
  if(raw.version===1){
    raw={...raw,version:2,stepsLog:[],workouts:[]};
    // Los micronutrientes ausentes significan «desconocido», nunca cero.
    for(const f of raw.customFoods||[]) for(const k of KEYS)if(!(k in f.nutrition))f.nutrition[k]=null;
    for(const day of Object.values(raw.diary||{})) for(const arr of Object.values(day||{}))for(const e of arr||[])for(const k of KEYS)if(!(k in e.food.nutrition))e.food.nutrition[k]=null;
    for(const meal of raw.savedMeals||[])for(const e of meal.items||[])for(const k of KEYS)if(!(k in e.food.nutrition))e.food.nutrition[k]=null;
    for(const recipe of raw.customRecipes||[])for(const e of recipe.ingredients||[])for(const k of KEYS)if(!(k in e.food.nutrition))e.food.nutrition[k]=null;
  }
  if(!validateState(raw))throw Error('Los datos no tienen un formato válido.');
  return raw;
}
export function readState(storage=localStorage){
  const text=storage.getItem(STORAGE_KEY)||storage.getItem(OLD_KEY);
  if(!text)return createState();
  return migrate(JSON.parse(text));
}
export function writeState(state,storage=localStorage){
  if(!validateState(state))throw Error('No se han podido guardar: datos inválidos.');
  storage.setItem(STORAGE_KEY,JSON.stringify(state));
}
export function backupBlob(state){if(!validateState(state))throw Error('Estado inválido.');return new Blob([JSON.stringify(state,null,2)],{type:'application/json'});}
export function wipeState(storage=localStorage){storage.removeItem(STORAGE_KEY);storage.removeItem(OLD_KEY);}
