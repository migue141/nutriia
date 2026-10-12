
export const KEYS = [
  "kcal", "protein", "carbs", "fat",
  "sugar", "fiber", "calcium",
  "iron", "sodium", "vitaminC"
];

export const MEALS = [
  "desayuno", "comida", "merienda", "cena"
];

export const ACTIVITY = {
  sedentario: 1.2,
  ligero: 1.375,
  medio: 1.55,
  muy_activo: 1.725
};

export function createState() {
  return {
    version: 2,
    profile: {
      name: "",
      age: null,
      sex: "",
      weight: null,
      height: null,
      activity: "medio",
      objective: "mantener",
      proteinPercent: 25,
      carbsPercent: 50,
      fatPercent: 25
    },
    diary: {},
    customFoods: [],
    customRecipes: [],
    foodFavorites: [],
    recipeFavorites: [],
    savedMeals: [],
    weightLog: [],
    stepsLog: [],
    workouts: []
  };
}

export function validateState(state) {
  if (!state || typeof state !== "object" ||
      Array.isArray(state) || state.version !== 2) {
    return false;
  }

  const arrays = [
    "customFoods", "customRecipes",
    "savedMeals", "weightLog",
    "stepsLog", "workouts"
  ];

  if (!arrays.every(key => Array.isArray(state[key]))) {
    return false;
  }

  if (!state.diary ||
      typeof state.diary !== "object" ||
      Array.isArray(state.diary)) {
    return false;
  }

  if (!state.profile ||
      typeof state.profile !== "object") {
    return false;
  }

  return true;
}

export function round(value, decimals = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;

  const factor = 10 ** decimals;
  return Math.round((number + Number.EPSILON) * factor)
    / factor;
}

export function convertQuantity(quantity, from, to) {
  const n = Number(quantity);

  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("La cantidad debe ser mayor que cero.");
  }

  if (from === to) return n;

  const factors = {
    g: ["masa", 1],
    kg: ["masa", 1000],
    ml: ["volumen", 1],
    l: ["volumen", 1000],
    unidad: ["unidad", 1]
  };

  if (!factors[from] || !factors[to] ||
      factors[from][0] !== factors[to][0]) {
    throw new Error("Unidades incompatibles.");
  }

  return n * factors[from][1] / factors[to][1];
}

export function nutritionFor(food, quantity, unit) {
  if (!food || !food.nutrition) {
    throw new Error("Alimento no válido.");
  }

  const base = food.baseUnit || "g";
  const amount = convertQuantity(
    quantity, unit || base, base
  );

  const per = Number(food.per ?? 100);

  if (!Number.isFinite(per) || per <= 0) {
    throw new Error("Base nutricional inválida.");
  }

  const result = {};

  for (const key of KEYS) {
    const value = food.nutrition[key];

    if (value === null || value === undefined ||
        value === "") {
      result[key] = null;
      continue;
    }

    const n = Number(value);
    result[key] = Number.isFinite(n) && n >= 0
      ? n * amount / per
      : null;
  }

  return result;
}

export function sumNutrition(items) {
  const sums = Object.fromEntries(
    KEYS.map(key => [key, 0])
  );

  const known = Object.fromEntries(
    KEYS.map(key => [key, 0])
  );

  const missing = Object.fromEntries(
    KEYS.map(key => [key, 0])
  );

  for (const item of items) {
    const nutrition = nutritionFor(
      item.food, item.quantity, item.unit
    );

    for (const key of KEYS) {
      if (nutrition[key] === null) {
        missing[key]++;
      } else {
        sums[key] += nutrition[key];
        known[key]++;
      }
    }
  }

  const result = {};

  for (const key of KEYS) {
    result[key] = known[key] > 0
      ? round(sums[key])
      : null;
  }

  return {
    values: result,
    missing,
    incomplete: KEYS.filter(key => missing[key] > 0)
  };
}

export function estimateEnergy(profile) {
  const weight = Number(profile.weight);
  const height = Number(profile.height);
  const age = Number(profile.age);

  if (![weight, height, age].every(Number.isFinite) ||
      weight <= 0 || height <= 0 || age < 18 ||
      age > 110) {
    return null;
  }

  let sexConstant;

  if (profile.sex === "hombre") {
    sexConstant = 5;
  } else if (profile.sex === "mujer") {
    sexConstant = -161;
  } else {
    return null;
  }

  const basal = 10 * weight +
    6.25 * height - 5 * age + sexConstant;

  const factor = ACTIVITY[profile.activity] || 1.2;
  const maintenance = basal * factor;

  return {
    basal: Math.round(basal),
    maintenance: Math.round(maintenance),
    approximate: true
  };
}

export function calculateMacros(kcal, percentages) {
  const p = Number(percentages.protein);
  const c = Number(percentages.carbs);
  const f = Number(percentages.fat);

  if (![p, c, f, kcal].every(Number.isFinite) ||
      kcal <= 0 || p < 0 || c < 0 || f < 0 ||
      Math.abs(p + c + f - 100) > 0.01) {
    throw new Error("Los porcentajes deben sumar 100.");
  }

  return {
    protein: round(kcal * p / 100 / 4, 1),
    carbs: round(kcal * c / 100 / 4, 1),
    fat: round(kcal * f / 100 / 9, 1)
  };
}
