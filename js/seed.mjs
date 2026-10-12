
const f=(id,name,baseUnit,n,per=100)=>({
  id,name,baseUnit,per,source:'ejemplo',
  nutrition:{
    kcal:n[0],protein:n[1],carbs:n[2],
    fat:n[3],sugar:n[4],fiber:n[5]
  }
});

// Valores aproximados de ejemplo, no verificados.
export const SAMPLE_FOODS=[
 f('avena','Copos de avena','g',[389,16.9,66.3,6.9,1,10.6]),
 f('platano','Plátano','g',[89,1.1,22.8,.3,12.2,2.6]),
 f('leche','Leche entera','ml',[61,3.2,4.8,3.3,4.8,0]),
 f('huevo','Huevo mediano','unidad',[72,6.3,.4,4.8,.2,0],1),
 f('arroz','Arroz blanco cocido','g',[130,2.7,28.2,.3,.1,.4]),
 f('pollo','Pechuga de pollo cocida','g',[165,31,0,3.6,0,0]),
 f('aceite','Aceite de oliva','g',[884,0,0,100,0,0]),
 f('tomate','Tomate','g',[18,.9,3.9,.2,2.6,1.2]),
 f('pan','Pan integral','g',[247,13,41,4.2,5,7]),
 f('yogur','Yogur natural entero','g',[61,3.5,4.7,3.3,4.7,0]),
 f('garbanzos','Garbanzos cocidos','g',[164,8.9,27.4,2.6,4.8,7.6]),
 f('manzana','Manzana','g',[52,.3,13.8,.2,10.4,2.4]),
 f('atun','Atún al natural escurrido','g',[116,26,0,1,0,0]),
 f('patata','Patata cocida','g',[87,1.9,20.1,.1,.9,1.8]),
 f('zanahoria','Zanahoria','g',[41,.9,9.6,.2,4.7,2.8]),
 f('pasta','Pasta cocida','g',[157,5.8,30.9,.9,.6,1.8]),
 f('pepino','Pepino','g',[15,.7,3.6,.1,1.7,.5]),
 f('lentejas','Lentejas cocidas','g',[116,9,20.1,.4,1.8,7.9])
];

const ing=(id,quantity,unit='g')=>({
 id:`example-${id}`,
 food:SAMPLE_FOODS.find(f=>f.id===id),
 quantity,unit
});

export const SAMPLE_RECIPES=[
 {
  id:'r-tostada',
  title:'Tostada con huevo y tomate',
  minutes:12,servings:1,
  steps:'1. Tuesta el pan.\n2. Cocina el huevo.\n3. Añade tomate y sirve.',
  ingredients:[
   ing('pan',70),ing('huevo',1,'unidad'),ing('tomate',100)
  ],
  source:'ejemplo',tags:['Rápida','Económica']
 },
 {
  id:'r-pollo',
  title:'Bol de arroz con pollo',
  minutes:20,servings:2,
  steps:'1. Prepara el arroz y el pollo.\n2. Corta el tomate.\n3. Reparte en dos boles y añade aceite.',
  ingredients:[
   ing('arroz',300),ing('pollo',250),
   ing('tomate',150),ing('aceite',15)
  ],
  source:'ejemplo',tags:['Económica']
 },
 {
  id:'r-garbanzos',
  title:'Ensalada de garbanzos y atún',
  minutes:10,servings:2,
  steps:'1. Enjuaga los garbanzos.\n2. Mezcla con atún, tomate y pepino.\n3. Aliña al gusto.',
  ingredients:[
   ing('garbanzos',300),ing('atun',140),
   ing('tomate',160),ing('pepino',120)
  ],
  source:'ejemplo',tags:['Rápida','Económica']
 },
 {
  id:'r-yogur',
  title:'Bol de yogur, avena y plátano',
  minutes:5,servings:1,
  steps:'1. Pon el yogur en un bol.\n2. Añade avena y plátano troceado.\n3. Mezcla y disfruta.',
  ingredients:[
   ing('yogur',200),ing('avena',45),ing('platano',110)
  ],
  source:'ejemplo',tags:['Rápida','Económica']
 },
 {
  id:'r-lentejas',
  title:'Lentejas con zanahoria y patata',
  minutes:25,servings:2,
  steps:'1. Cuece patata y zanahoria.\n2. Añade las lentejas cocidas.\n3. Calienta y sirve.',
  ingredients:[
   ing('lentejas',350),ing('zanahoria',180),
   ing('patata',200),ing('aceite',10)
  ],
  source:'ejemplo',tags:['Económica']
 }
];
