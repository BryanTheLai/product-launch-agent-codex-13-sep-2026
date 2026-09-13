export type IntakeMode = 'adapt_existing_product' | 'design_new_product_from_reference';

export type ProductType = 'lotion' | 'moisturizer' | 'serum' | 'toner' | 'sunscreen' | 'cleanser' | 'other';

export type FormFactor = 'tube' | 'pump_bottle' | 'jar' | 'dropper_bottle' | 'mist_bottle' | 'other';

export interface ProductIdentitySpec {
  productIdentityVersion: string;
  intakeMode: IntakeMode;
  productType: ProductType;
  formFactor: FormFactor;
  silhouetteAndProportions: string;
  dimensionsAndNetVolume: string;
  capClosureOrDispenser: string;
  containerMaterialAndFinish: string;
  bodyColorAndFormulaColor: string;
  labelLayoutAndApprovedCopy: string;
  logoTreatment: string;
  textureAndViscosity: string;
  physicalUsageBehavior: string;
  allowedCreativeChanges: string[];
  forbiddenProductChanges: string[];
  sourceAssets: string[];
  assumptions: string[];
  confidence: number;
}

export interface BrandContext {
  brandName: string;
  logoAsset: 'supplied' | 'provisional' | 'none';
  watermarkAsset: 'supplied' | 'provisional' | 'none';
  referenceUrls: string[];
  paletteAndTypographyCues: string;
  toneOfVoice: string;
  approvedClaims: string[];
  prohibitedClaims: string[];
  audience: string;
  usageRightsAndNotes: string;
}

export type ArtifactKind =
  | 'product_master'
  | 'packshot'
  | 'catalog'
  | 'lifestyle'
  | 'texture'
  | 'application'
  | 'poster'
  | 'video'
  | 'pptx'
  | 'pdf';

export interface Artifact {
  id: string;
  runId: string;
  threadId: string;
  kind: ArtifactKind;
  variantId: 'A' | 'B' | 'C' | null;
  localPath: string;
  parentArtifactId: string | null;
  sourceProductArtifactId: string;
  productIdentityVersion: string;
  prompt: string;
  provider: string;
  providerModel: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'pending';
  error?: string;
}

export interface PosterVariant {
  variantId: 'A' | 'B' | 'C';
  conceptName: string;
  hypothesis: string;
  audience: string;
  visualDirection: string;
  headline: string;
  imageArtifactId: string;
  prompt: string;
}

export type EvidenceLabel = 'observed' | 'inferred' | 'assumption' | 'user-supplied';

export interface EconomicsResearch {
  productCategory: string;
  geography: string;
  channel: string;
  priceRange: { min: number; max: number; unit: string };
  selectedPrice: number;
  cogsRange: { min: number; max: number; unit: string };
  selectedCogs: number;
  packagingCost: number;
  fulfilmentCost: number;
  paymentFee: number;
  channelFees: number;
  returnsAllowance: number;
  trafficAssumption: number;
  conversionRateAssumption: number;
  unitsPerOrder: number;
  volumeScenarios: {
    low: { orders: number; revenue: number; grossProfit: number };
    base: { orders: number; revenue: number; grossProfit: number };
    high: { orders: number; revenue: number; grossProfit: number };
  };
  grossProfitPerUnit: number;
  grossMargin: number;
  contributionPerOrder: number;
  breakEvenOrders: number;
  creativeGenerationCost: number;
  sources: Array<{ title: string; url: string; relevance: string }>;
  confidence: number;
  evidenceLabels: Array<{ field: string; label: EvidenceLabel }>;
}

export interface CommercialSignal {
  signal: string;
  sourceUrl: string;
  evidence: string;
  commercialImplication: string;
  confidence: number;
}

export interface UGCSpec {
  durationMode: 'five_second_single_clip' | 'fourteen_second_multi_clip';
  aspectRatio: '9:16';
  audio: 'none' | 'native_provider_audio' | 'added_later';
  referenceVideoId?: string;
  productIdentityVersion: string;
  shots: Array<{
    duration: number;
    framing: string;
    action: string;
    cameraMotion: string;
    texturePhysics: string;
    lighting: string;
    overlayCopy: string;
    transition: string;
  }>;
  claimsPolicy: string;
  negativeConstraints: string;
}

export interface DeckSlide {
  slideNumber: number;
  type: 'executive' | 'identity' | 'signals' | 'posters' | 'economics' | 'video' | 'recommendation';
  title: string;
  subtitle?: string;
  content: Record<string, unknown>;
  notes?: string;
}

export interface DeckSpec {
  title: string;
  subtitle: string;
  brandName: string;
  productType: string;
  productIdentityVersion: string;
  theme?: 'im8_crimson' | 'warm_earth';
  slides: DeckSlide[];
}

export interface ThreadState {
  threadId: string;
  runId: string;
  brandContext: BrandContext;
  currentBrief: string;
  productIdentitySpec: ProductIdentitySpec;
  productIdentityVersion: string;
  assetPack: Record<string, Artifact>;
  posterVariants: PosterVariant[];
  recommendedVariantId: 'A' | 'B' | 'C';
  economics: EconomicsResearch;
  signals: CommercialSignal[];
  ugcSpec?: UGCSpec;
  latestArtifactId: string;
  artifactHistory: Artifact[];
  pptxArtifactId?: string;
  pdfArtifactId?: string;
  videoArtifactId?: string;
}

export interface CreativeBriefInput {
  threadId: string;
  rawText: string;
  attachedImageUrl?: string;
  attachedImageLocalPath?: string;
  referenceUrl?: string;
  brandName?: string;
  productType?: ProductType;
  formFactor?: FormFactor;
  supplierCogsQuote?: number;
  supplierPriceQuote?: number;
}
