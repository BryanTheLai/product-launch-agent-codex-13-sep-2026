import type {
  CreativeBriefInput,
  FormFactor,
  IntakeMode,
  ProductIdentitySpec,
  ProductType,
} from './types';

interface FormFactorRules {
  defaultFormFactor: FormFactor;
  allowedFormFactors: FormFactor[];
  dispenser: string;
  texturePhysics: string;
  forbiddenArtifacts: string[];
}

const FORM_FACTOR_BEHAVIOR_RULES: Record<ProductType, FormFactorRules> = {
  moisturizer: {
    defaultFormFactor: 'jar',
    allowedFormFactors: ['jar', 'pump_bottle', 'tube'],
    dispenser: 'Heavy-walled amber glass jar with matte black screw lid, internal protective barrier disc',
    texturePhysics: 'Rich whipped emulsion, cohesive soft peaks, velvety melt upon skin contact',
    forbiddenArtifacts: ['watery serum pour', 'floating droplet', 'inconsistent container geometry'],
  },
  lotion: {
    defaultFormFactor: 'pump_bottle',
    allowedFormFactors: ['pump_bottle', 'tube'],
    dispenser: 'Precision twist-lock lotion pump with matte finish nozzle',
    texturePhysics: 'Smooth spreadable lotion, semi-viscous cream ribbon',
    forbiddenArtifacts: ['watery serum pour', 'detached liquid droplets', 'impossible nozzle shape'],
  },
  serum: {
    defaultFormFactor: 'dropper_bottle',
    allowedFormFactors: ['dropper_bottle', 'pump_bottle'],
    dispenser: 'Calibrated glass pipette dropper with rubber bulb collar',
    texturePhysics: 'Cohesive translucent droplet, viscous surface tension, controlled vertical tear',
    forbiddenArtifacts: ['thick cream extrusion', 'opaque paste', 'random non-dropper cap'],
  },
  toner: {
    defaultFormFactor: 'mist_bottle',
    allowedFormFactors: ['mist_bottle', 'pump_bottle'],
    dispenser: 'Ultra-fine atomizing micro-mist spray nozzle or precision reducer plug',
    texturePhysics: 'Water-light transparent fluid, micro-droplet mist suspension',
    forbiddenArtifacts: ['gel beads', 'squeeze-tube action', 'thick paste'],
  },
  sunscreen: {
    defaultFormFactor: 'tube',
    allowedFormFactors: ['tube', 'pump_bottle'],
    dispenser: 'Flexible matte tube with flip-top cap or airless precision pump',
    texturePhysics: 'Non-greasy sheer fluid or light lotion, zero white-cast blend',
    forbiddenArtifacts: ['unapproved medical claims', 'unverified SPF numbers', 'glass jar packaging'],
  },
  cleanser: {
    defaultFormFactor: 'pump_bottle',
    allowedFormFactors: ['pump_bottle', 'tube'],
    dispenser: 'Wide-bore foam pump or dispensing flip-cap',
    texturePhysics: 'Silky gel-to-foam emulsion, delicate micro-bubbles',
    forbiddenArtifacts: ['watery serum pour', 'thick solid wax'],
  },
  other: {
    defaultFormFactor: 'pump_bottle',
    allowedFormFactors: ['pump_bottle', 'tube', 'jar', 'dropper_bottle', 'mist_bottle'],
    dispenser: 'Ergonomic functional cosmetic dispenser',
    texturePhysics: 'Homogeneous cosmetic formula appropriate to product function',
    forbiddenArtifacts: ['impossible physics', 'inconsistent container geometries'],
  },
};

export function classifyIntakeMode(input: CreativeBriefInput): IntakeMode {
  const text = input.rawText.toLowerCase();
  if (
    input.attachedImageLocalPath ||
    input.attachedImageUrl ||
    text.includes('adapt this') ||
    text.includes('make this exact') ||
    text.includes('this photo') ||
    text.includes('ugly product photo')
  ) {
    return 'adapt_existing_product';
  }
  return 'design_new_product_from_reference';
}

export function inferProductType(input: CreativeBriefInput): ProductType {
  if (input.productType) return input.productType;
  const text = input.rawText.toLowerCase();
  if (text.includes('moisturiz')) return 'moisturizer';
  if (text.includes('serum')) return 'serum';
  if (text.includes('toner')) return 'toner';
  if (text.includes('sunscreen') || text.includes('spf')) return 'sunscreen';
  if (text.includes('cleanser') || text.includes('wash')) return 'cleanser';
  if (text.includes('lotion') || text.includes('cream')) return 'lotion';
  return 'moisturizer';
}

export function inferFormFactor(input: CreativeBriefInput, productType: ProductType): FormFactor {
  if (input.formFactor) return input.formFactor;
  const text = input.rawText.toLowerCase();
  if (text.includes('jar') || text.includes('tub')) return 'jar';
  if (text.includes('pump') || text.includes('bottle')) return 'pump_bottle';
  if (text.includes('tube') || text.includes('squeeze')) return 'tube';
  if (text.includes('dropper') || text.includes('pipette')) return 'dropper_bottle';
  if (text.includes('mist') || text.includes('spray')) return 'mist_bottle';

  return FORM_FACTOR_BEHAVIOR_RULES[productType].defaultFormFactor;
}

export function createProductIdentitySpec(
  input: CreativeBriefInput,
  version = 'v1'
): ProductIdentitySpec {
  const intakeMode = classifyIntakeMode(input);
  const productType = inferProductType(input);
  const formFactor = inferFormFactor(input, productType);
  const rules = FORM_FACTOR_BEHAVIOR_RULES[productType];

  const brandName = input.brandName || 'Stackifier';

  let silhouetteAndProportions = '';
  let dimensionsAndNetVolume = '';
  let containerMaterialAndFinish = '';
  let bodyColorAndFormulaColor = '';

  if (formFactor === 'jar') {
    silhouetteAndProportions = 'Cylindrical wide-mouth low-profile cosmetic jar with clean 1:1.2 diameter-to-height ratio';
    dimensionsAndNetVolume = '50 ml / 1.7 fl. oz. net wt. (62 mm diameter x 48 mm height)';
    containerMaterialAndFinish = 'Frosted heavy-weight amber glass with matte tactile ceramic finish';
    bodyColorAndFormulaColor = 'Warm translucent amber container with cloud-white whipped barrier cream';
  } else if (formFactor === 'pump_bottle') {
    silhouetteAndProportions = 'Tall slender cylindrical bottle with flush-fit minimalist pump head';
    dimensionsAndNetVolume = '100 ml / 3.4 fl. oz. net vol. (40 mm diameter x 145 mm height)';
    containerMaterialAndFinish = 'Matte-coated recyclable aluminum or frosted borosilicate glass';
    bodyColorAndFormulaColor = 'Stone-warm neutral matte finish with ivory cream formula';
  } else if (formFactor === 'tube') {
    silhouetteAndProportions = 'Tapered flexible oval cosmetic tube with sealed crimp and flat-top screw closure';
    dimensionsAndNetVolume = '75 ml / 2.5 fl. oz. net vol. (35 mm width x 130 mm length)';
    containerMaterialAndFinish = 'Soft-touch post-consumer recycled matte polymer';
    bodyColorAndFormulaColor = 'Earthy bone-white container with semi-translucent lotion ribbon';
  } else if (formFactor === 'dropper_bottle') {
    silhouetteAndProportions = 'Classic apothecary dropper bottle with straight shoulder and graduated pipette';
    dimensionsAndNetVolume = '30 ml / 1.0 fl. oz. net vol. (33 mm diameter x 102 mm height)';
    containerMaterialAndFinish = 'UV-protective dark amber glass with rubber bulb and metal collar';
    bodyColorAndFormulaColor = 'Deep amber glass with golden translucent viscous active serum';
  } else {
    silhouetteAndProportions = 'Cylindrical cosmetic bottle with calibrated precision spray head';
    dimensionsAndNetVolume = '150 ml / 5.1 fl. oz. net vol. (45 mm diameter x 165 mm height)';
    containerMaterialAndFinish = 'Clear frosted PET or glass with aluminum atomizer';
    bodyColorAndFormulaColor = 'Frosted neutral container with clear hydrating liquid';
  }

  const labelLayoutAndApprovedCopy = `Clean typographic hierarchy: '${brandName}' primary wordmark in bold sans-serif, '${productType.toUpperCase()}' functional descriptor in small tracked uppercase, net volume in crisp baseline footer. No unapproved medical or SPF claims.`;
  const logoTreatment = 'Provisional minimalist typographic wordmark with balanced letter-spacing; no unapproved icon or trademark symbol';

  const allowedCreativeChanges = [
    'Scene environment and background textures (tactile stone, warm wood, raw travertine, minimal podium)',
    'Camera angle and focal length (eye-level hero, 45-degree isometric, overhead flatlay, close macro)',
    'Lighting design (warm raking sunlight, soft diffused beauty studio, crisp directional shadows)',
    'Faceless model or hand application interactions',
    'Poster composition, typography hierarchy, headline, and creative hypothesis',
  ];

  const forbiddenProductChanges = [
    'Changing container geometry, silhouette proportions, or net volume',
    'Altering cap, closure, or dispenser mechanism',
    'Changing primary container material, finish, or color grade',
    'Inventing unapproved logos, brand emblems, or third-party endorsements',
    'Altering physical formula viscosity or creating impossible fluid behaviors',
    ...rules.forbiddenArtifacts,
  ];

  const sourceAssets: string[] = [];
  if (input.attachedImageUrl) sourceAssets.push(input.attachedImageUrl);
  if (input.attachedImageLocalPath) sourceAssets.push(input.attachedImageLocalPath);
  if (input.referenceUrl) sourceAssets.push(input.referenceUrl);

  return {
    productIdentityVersion: version,
    intakeMode,
    productType,
    formFactor,
    silhouetteAndProportions,
    dimensionsAndNetVolume,
    capClosureOrDispenser: rules.dispenser,
    containerMaterialAndFinish,
    bodyColorAndFormulaColor,
    labelLayoutAndApprovedCopy,
    logoTreatment,
    textureAndViscosity: rules.texturePhysics,
    physicalUsageBehavior: `User unseals the ${formFactor}, dispenses a calibrated amount of ${productType}, and smooths onto skin with instant absorption.`,
    allowedCreativeChanges,
    forbiddenProductChanges,
    sourceAssets,
    assumptions: [
      intakeMode === 'design_new_product_from_reference'
        ? 'Designed new product identity inspired by reference direction without copying third-party trade dress'
        : 'Preserved physical geometry, finish, and packaging from supplied source image',
      'Using provisional wordmark pending final brand asset delivery',
      `Defaulted product form factor to ${formFactor} appropriate for high-efficacy ${productType}`,
    ],
    confidence: intakeMode === 'adapt_existing_product' ? 0.95 : 0.88,
  };
}
