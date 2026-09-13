import type { ProductIdentitySpec, UGCSpec } from './types';
import { renderTemplate } from './templates/engine';

export type BlueprintId =
  | 'egg-coverage-test'
  | 'underwater-bubble-hydration'
  | 'seasonal-tap-swap'
  | 'sun-stick-dual-finish'
  | 'asmr-beauty-recipe'
  | 'problem-solution-invisible-swatch'
  | 'skin-1004-soothing-dispense';

export interface VideoProductionBlueprint {
  id: BlueprintId;
  title: string;
  format: 'comparison_macro' | 'fluid_dynamics' | 'rhythmic_transition' | 'sensory_asmr_recipe' | 'problem_solution_swatch' | 'split_finish_demo' | 'soothing_ampoule_dispense';
  referenceVideoFilename: string;
  masterPrompt: string;
  hook: {
    title: string;
    copy: string;
    visualConcept: string;
  };
  valueProp: string;
  lightingConfig: {
    style: string;
    keyLight: string;
    fillLight: string;
    accentLight?: string;
    colorTemperature: string;
  };
  cameraHardware: {
    camera: string;
    lens: string;
    rigging: string;
    settings: {
      frameRate: string;
      shutterSpeed: string;
      aperture: string;
      iso: string;
    };
    props: string[];
    editingTechnique: string;
  };
  shots: Array<{
    timeRange: string;
    durationSec: number;
    title: string;
    action: string;
    cameraAngle: string;
    overlayText: string;
  }>;
  buildKlingPrompt: (productSpec: ProductIdentitySpec, brandName?: string) => string;
  buildUGCSpec: (productSpec: ProductIdentitySpec, brandName?: string) => UGCSpec;
}

export const VIDEO_BLUEPRINTS: Record<BlueprintId, VideoProductionBlueprint> = {
  'egg-coverage-test': {
    id: 'egg-coverage-test',
    title: 'Coverage Test: Eggshell Side-by-Side Comparison',
    format: 'comparison_macro',
    referenceVideoFilename: 'ref-video-egg-coverage-test.mp4',
    masterPrompt: `A vertical (9:16) macro side-by-side product comparison testing tinted sunscreens on raw brown eggs to demonstrate coverage and finish. Top-down bird's-eye camera view over a clean, matte white desk surface. Bright studio lighting illuminates two brown eggs held upright by clean, bare hands. Text overlay at the top reads "Coverage Test" with labels "Other Tinted SPF" on the left and "Tinted Dayscreen" on the right. Smooth, controlled movement as product is squeezed onto each egg and blended using black makeup cushion puffs. Pristine, minimal aesthetic, cinematic clarity, ultra-crisp detail.`,
    hook: {
      title: 'Unexpected Surface Hook',
      copy: 'Coverage Test: The egg has spoken 🥚',
      visualConcept: 'Testing makeup coverage directly on textured brown eggshells to prove pore blurring.',
    },
    valueProp: 'A direct, no-fluff comparison showing how the target product blurs texture, evenness, and speckles compared to a generic tinted SPF.',
    lightingConfig: {
      style: 'High-key commercial lighting to eliminate harsh shadows and emphasize liquid textures and shell pores.',
      keyLight: '200W-300W LED light positioned directly above camera setup, softened with a large (36" to 48") softbox diffusion.',
      fillLight: 'Dual white foam boards placed on left and right sides of white table surface to wrap neutral light around eggs.',
      colorTemperature: 'Daylight neutral (~5600K)',
    },
    cameraHardware: {
      camera: '4K-capable mirrorless camera (Sony FX3 / A7S III or Canon R5) mounted overhead on a C-stand with a boom arm.',
      lens: '50mm f/2.8 Macro or 90mm f/2.8 Macro lens to capture close-up skin/shell detail without barrel distortion.',
      rigging: 'Rigid overhead C-stand with extension boom arm.',
      settings: {
        frameRate: '60 fps (for smooth blending footage)',
        shutterSpeed: '1/120s',
        aperture: 'f/5.6 - f/8 (maintains full depth of field across both eggs)',
        iso: '100 - 400 (clean noise-free shadow detail)',
      },
      props: [
        'Two brown eggs with natural speckles',
        'Target product tube / dispenser',
        'Generic beige squeeze-tube (unbranded)',
        'Two black teardrop cushion makeup puffs',
      ],
      editingTechnique: 'Continuous bird-eye macro frame with synchronized dual-hand application.',
    },
    shots: [
      {
        timeRange: '0:00 - 0:01',
        durationSec: 1.0,
        title: 'The Setup',
        action: 'Hands hold two brown eggs upright over a pure white background. Top text overlays display "Coverage Test", "Other Tinted SPF", and product name.',
        cameraAngle: "Direct top-down (90° bird's-eye macro view)",
        overlayText: 'Coverage Test',
      },
      {
        timeRange: '0:01 - 0:02',
        durationSec: 1.5,
        title: 'Product Application',
        action: 'Left hand squeezes generic tinted formula; right hand squeezes target product onto brown eggshells simultaneously.',
        cameraAngle: 'Direct top-down, tight focus on drops landing on eggshells',
        overlayText: 'Other SPF vs. Target Formula',
      },
      {
        timeRange: '0:03 - 0:05',
        durationSec: 2.0,
        title: 'The Blend Test',
        action: 'Two hands simultaneously pat down product using black teardrop cushion puffs, working top to bottom.',
        cameraAngle: 'Top-down, slightly zoomed macro shot capturing texture absorption and pore blur',
        overlayText: 'Instant blurring action',
      },
      {
        timeRange: '0:05 - 0:06',
        durationSec: 1.5,
        title: 'The Reveal',
        action: 'Finished eggs held up to camera. Left egg remains textured and spotty; right egg has smooth, radiant, pore-blurred finish.',
        cameraAngle: 'Top-down macro frame lock',
        overlayText: 'The egg has spoken 🥚',
      },
    ],
    buildKlingPrompt: (productSpec, brandName) =>
      renderTemplate('video/egg_coverage_test.jinja', { productSpec, brandName }),
    buildUGCSpec: (productSpec, brandName) => {
      const brand = brandName || 'Target';
      return {
        durationMode: 'five_second_single_clip',
        aspectRatio: '9:16',
        audio: 'none',
        referenceVideoId: 'ref-video-egg-coverage-test.mp4',
        productIdentityVersion: productSpec.productIdentityVersion,
        shots: [
          {
            duration: 2.5,
            framing: "Top-down 90° bird's-eye macro over pristine matte white surface",
            action: `Hands dispense generic lotion onto left egg and ${brand} ${productSpec.productType} onto right brown egg`,
            cameraMotion: 'Static locked overhead angle with micro-zoom',
            texturePhysics: productSpec.textureAndViscosity,
            lighting: '5600K high-key overhead softbox with dual white bounce boards',
            overlayCopy: 'Coverage Test 🥚',
            transition: 'Direct cut into cushion puff pat-down',
          },
          {
            duration: 2.5,
            framing: 'Macro close-up on finished egg surfaces side-by-side',
            action: `Black cushion puffs blend both formulas. Right egg achieves smooth, airbrushed pore-less finish while left remains patchy`,
            cameraMotion: 'Subtle tilt upward holding eggs toward camera',
            texturePhysics: 'Silky, translucent, non-streaky even finish',
            lighting: 'Even daylight wrap-around illumination',
            overlayCopy: 'The egg has spoken ✨',
            transition: 'Clean fade to final brand lockup',
          },
        ],
        claimsPolicy: 'Descriptive cosmetic texture, blurring, and daily coverage only. No unverified dermatological SPF claims.',
        negativeConstraints: 'No broken egg yolks, no morphing shell geometry, no unnatural skin filters, no distorted package labels.',
      };
    },
  },

  'underwater-bubble-hydration': {
    id: 'underwater-bubble-hydration',
    title: 'Underwater Micro-Bubble Splash Hydration',
    format: 'fluid_dynamics',
    referenceVideoFilename: 'ref-video-underwater-bubble-hydration.mp4',
    masterPrompt: `A vertical (9:16) commercial product shot featuring sunscreen/moisturizer tube surrounded by an underwater cascade of fine, rising air bubbles. Soft blue-tinted aquatic lighting highlights moisture droplets clinging to the matte white tube and bold Korean typography. Fluid vertical camera pans and dynamic cuts shift between close-up details of the packaging, flowing water streams, and rising bubbles. Refreshing, ultra-clean aesthetic with hyper-detailed fluid dynamics and high-speed clarity.`,
    hook: {
      title: 'Micro-Bubble Fluid Hook',
      copy: 'Ultra-lightweight splash hydration 🌊',
      visualConcept: 'High-speed underwater macro with dense rising bubbles and clinging water beads to signal weightless hydration.',
    },
    valueProp: 'Highlights the refreshing, weightless, and hydrating nature of the formula compared to traditional heavy creams.',
    lightingConfig: {
      style: 'Aquatic high-key backlight combined with crisp directional key lighting to make water droplets and air bubbles glisten.',
      keyLight: '300W daylight LED with a parabolic softbox placed at a 45° top-front angle to create sharp, gleaming highlights.',
      fillLight: 'White reflector board below camera to soften deep shadows on bottom text.',
      accentLight: 'High-intensity LED panel positioned behind transparent acrylic water tank, gelled with cool daylight white (~6000K).',
      colorTemperature: 'Cool daylight (~6000K)',
    },
    cameraHardware: {
      camera: 'High-speed cinema camera (Sony FX6, RED Komodo, or Sony A7S III) capable of 4K at 120fps.',
      lens: '90mm or 100mm f/2.8 Macro Lens (tight focus on micro-bubbles and fine typography without distortion).',
      rigging: 'Vertical C-stand boom or motorized slider for controlled vertical pan shots.',
      settings: {
        frameRate: '120 fps (downsampled to 24/30 fps for crisp slow-motion water dynamics)',
        shutterSpeed: '1/250s to 1/500s (freezes individual air bubbles and water drops)',
        aperture: 'f/4 to f/5.6 (maintains sharp product text while keeping background softly blurred)',
        iso: '200 - 400',
      },
      props: [
        'Custom acrylic clear water tank',
        'Submersible air bubbler / diffuser bar at tank bottom',
        'Hydrophobic coating spray on product package for perfect beading',
      ],
      editingTechnique: 'High-speed slow-motion fluid cuts alternating with locked hero reveals.',
    },
    shots: [
      {
        timeRange: '0:00 - 0:01',
        durationSec: 1.5,
        title: 'Micro-Bubble Fluid Hook',
        action: 'Camera pans vertically over the inverted product container engulfed in a dense bed of rising micro-bubbles.',
        cameraAngle: 'Close-up macro (45° diagonal sweep), low depth of field',
        overlayText: 'Weightless Hydration',
      },
      {
        timeRange: '0:01 - 0:03',
        durationSec: 1.5,
        title: 'Product Reveal & Water Droplets',
        action: 'Fast cut to clean centered shot of upright product container as water trickles down its sides and droplets form.',
        cameraAngle: 'Straight-on eye-level macro shot centered on branding',
        overlayText: 'Refreshing Splash Finish',
      },
      {
        timeRange: '0:03 - 0:05',
        durationSec: 2.0,
        title: 'Dynamic Water Flow Hero',
        action: 'Water streams continuously past container in slow motion while rising bubbles glisten in backlight.',
        cameraAngle: 'Locked central eye-level portrait shot',
        overlayText: 'Zero-Weight Barrier Care',
      },
    ],
    buildKlingPrompt: (productSpec, brandName) =>
      renderTemplate('video/underwater_bubble_hydration.jinja', { productSpec, brandName }),
    buildUGCSpec: (productSpec, brandName) => {
      const brand = brandName || 'Target';
      return {
        durationMode: 'five_second_single_clip',
        aspectRatio: '9:16',
        audio: 'none',
        referenceVideoId: 'ref-video-underwater-bubble-hydration.mp4',
        productIdentityVersion: productSpec.productIdentityVersion,
        shots: [
          {
            duration: 2.0,
            framing: 'Macro 45° diagonal sweep of submerged product in crystal water',
            action: `Dense cascade of micro-bubbles rises around ${brand} ${productSpec.formFactor} as light refracts through water`,
            cameraMotion: 'Smooth vertical tracking upward along container contour',
            texturePhysics: 'Fluid water dynamics, microscopic bubble streams, hydrophobic beading',
            lighting: 'Cool 6000K aquatic backlight with crisp front highlight',
            overlayCopy: 'Weightless Hydration 🫧',
            transition: 'High-speed bubble rush dissolve',
          },
          {
            duration: 3.0,
            framing: 'Locked eye-level hero portrait in clear aquatic tank',
            action: `Container stands firm as gentle water ripples pass; typography remains tack-sharp through crystal water`,
            cameraMotion: 'Subtle slow-motion push-in with locked orientation',
            texturePhysics: 'Crystal-clear aquatic ripple with glistening droplets',
            lighting: 'High-key commercial water tank illumination',
            overlayCopy: 'Zero Heavy Residue ✨',
            transition: 'Fade to end card',
          },
        ],
        claimsPolicy: 'Descriptive cosmetic hydration and sensory lightness only.',
        negativeConstraints: 'No murky or clouded water, no warped packaging lettering, no plastic refraction distortion of core logo.',
      };
    },
  },

  'seasonal-tap-swap': {
    id: 'seasonal-tap-swap',
    title: 'Seasonal Tap-Swap Routine Transition',
    format: 'rhythmic_transition',
    referenceVideoFilename: 'ref-video-seasonal-tap-swap.mp4',
    masterPrompt: `A vertical (9:16) minimalist skincare transition video set on a light wood tabletop against a neutral beige wall. Six skincare products are arranged in a neat horizontal line. A hand enters the frame from the left, tapping each product sequentially in sync with a rhythmic beat. With every tap, a product seamlessly morphs/swaps into a richer, fall-oriented alternative. Clean, natural daylight aesthetic, smooth stop-motion style transitions, warm fall ambiance. Top text overlay reads: "me on September 1st 🍂🤎".`,
    hook: {
      title: 'Rhythmic Routine Swap Meme',
      copy: 'me on September 1st 🍂🤎',
      visualConcept: 'Relatable seasonal transition meme with snap-swapping products to the beat of an audio track.',
    },
    valueProp: 'Signals a seasonal skincare routine shift from lightweight summer hydration to rich fall nourishment in an addictive quick-cut format.',
    lightingConfig: {
      style: 'Soft, warm, natural window daylight (golden hour / soft afternoon fall light).',
      keyLight: 'Large window light coming from right/top-right at 45°, softened with sheer white diffuser curtain.',
      fillLight: 'White poster board on left side to softly bounce light back and eliminate deep shadows.',
      colorTemperature: 'Warm daylight (~5000K–5500K) to emphasize golden tones',
    },
    cameraHardware: {
      camera: '4K mirrorless camera (Sony A7 IV / Canon R6 II) locked firmly on a rigid tripod.',
      lens: '35mm to 50mm prime lens (keeps full lineup in focus without edge distortion).',
      rigging: 'Rigid floor tripod with AE/AF Lock enabled.',
      settings: {
        frameRate: '60 fps',
        shutterSpeed: '1/120s',
        aperture: 'f/4 - f/5.6',
        iso: '100 - 400',
      },
      props: [
        'Light oak wood tabletop surface',
        'Neutral warm beige wall backdrop',
        'Lineup of 5-6 skincare bottles and jars in ascending height order',
        'Dried autumn leaves or minimal botanical accent in corner',
      ],
      editingTechnique: 'Match-cut / jump-cut editing aligned precisely to hand tap beats.',
    },
    shots: [
      {
        timeRange: '0:00 - 0:01',
        durationSec: 1.0,
        title: 'Summer Routine Setup',
        action: 'Summer products lined up on wooden counter. Hand taps the first product on the beat.',
        cameraAngle: 'High-angle 45° stationary wide shot showing full lineup',
        overlayText: 'me on September 1st 🍂',
      },
      {
        timeRange: '0:01 - 0:03',
        durationSec: 2.0,
        title: 'Sequential Snap Swaps',
        action: 'Hand taps products sequentially; each item snap-swaps to a richer amber/gold fall formulation on every beat.',
        cameraAngle: 'Locked 45° high-angle perspective',
        overlayText: 'Summer routine -> Fall nourishment',
      },
      {
        timeRange: '0:03 - 0:05',
        durationSec: 2.0,
        title: 'The Fall Routine Reveal',
        action: 'Hand pulls back out of frame, leaving the updated, fall-ready skincare lineup neatly arranged in warm afternoon glow.',
        cameraAngle: 'Locked high-angle master shot',
        overlayText: 'Ready for cozy season 🤎',
      },
    ],
    buildKlingPrompt: (productSpec, brandName) =>
      renderTemplate('video/seasonal_tap_swap.jinja', { productSpec, brandName }),
    buildUGCSpec: (productSpec, brandName) => {
      const brand = brandName || 'Target';
      return {
        durationMode: 'five_second_single_clip',
        aspectRatio: '9:16',
        audio: 'none',
        referenceVideoId: 'ref-video-seasonal-tap-swap.mp4',
        productIdentityVersion: productSpec.productIdentityVersion,
        shots: [
          {
            duration: 2.5,
            framing: 'Locked 45° high-angle wide of wooden tabletop lineup',
            action: `Hand taps skincare containers sequentially; rapid rhythmic jump-cuts swap each container into ${brand} fall lineup`,
            cameraMotion: 'Locked tripod shot with AE/AF locked exposure',
            texturePhysics: 'Solid physical tabletop stop-motion precision',
            lighting: 'Soft warm 5200K golden hour side window light',
            overlayCopy: 'me on September 1st 🍂',
            transition: 'Match-cut jump cuts on musical beats',
          },
          {
            duration: 2.5,
            framing: 'Tabletop view with hero focus on center container',
            action: `Hand withdraws leaving pristine lineup with ${brand} ${productSpec.productType} catching warm golden flare`,
            cameraMotion: 'Subtle slow-motion forward drift',
            texturePhysics: 'Warm amber glow, tactile matte bottle finishes',
            lighting: 'Warm diffused afternoon sunlight',
            overlayCopy: 'Fall barrier reset 🤎',
            transition: 'Clean fade out',
          },
        ],
        claimsPolicy: 'Lifestyle cosmetic routine transition only.',
        negativeConstraints: 'No wobbling camera motion, no lighting shifts between cuts, no warped bottles.',
      };
    },
  },

  'sun-stick-dual-finish': {
    id: 'sun-stick-dual-finish',
    title: 'Sun Stick Dual-Finish Comparison (Glow vs. Matte)',
    format: 'split_finish_demo',
    referenceVideoFilename: 'ref-video-sun-stick-dual-finish.mp4',
    masterPrompt: `Cinematic vertical 9:16 split-screen comparison demo of sun sticks. Text overlay at top reads: "Sun Stick just dropped 💛". Upper frame demonstrates the Glow Sun Stick gliding across the back of a clean hand, leaving a soft, radiant glass-skin sheen. Lower frame demonstrates the Matte Sun Stick gliding across the opposite skin area, leaving a silky, shine-free, velvet-blurred non-greasy matte finish. Side-by-side skin comparison under natural daylight reveals the distinct textural finishes. Direct macro framing, 50mm f/2.8 prime lens, smooth handheld glide across bare skin, instant barrier comfort.`,
    hook: {
      title: 'Finish Comparison Hook',
      copy: 'Glow vs. Matte Sun Stick just dropped 💛',
      visualConcept: 'Direct split-screen application contrasting dewy radiant glass-skin finish with velvety blurred matte finish on skin.',
    },
    valueProp: 'Helps consumers choose between dewy radiance and shine-free oil control in one instant visual comparison.',
    lightingConfig: {
      style: 'Clean, even high-key daylight to accurately showcase skin texture and optical finish without glare.',
      keyLight: '5500K soft daylight LED overhead with broad bounce board.',
      fillLight: 'White reflector opposite camera to ensure skin tones remain true.',
      colorTemperature: 'Daylight neutral (~5500K)',
    },
    cameraHardware: {
      camera: 'Handheld mirrorless or 4K smartphone (iPhone 15/16 Pro @ 60fps).',
      lens: '50mm f/2.8 macro prime lens.',
      rigging: 'Handheld with organic stabilization.',
      settings: {
        frameRate: '60 fps',
        shutterSpeed: '1/120s',
        aperture: 'f/2.8 - f/4',
        iso: '100 - 300',
      },
      props: [
        'Dual sun sticks (Glow yellow stick + Matte green/white stick)',
        'Clean bare hands',
      ],
      editingTechnique: 'Split-screen dual playback with synchronized gliding motion.',
    },
    shots: [
      {
        timeRange: '0:00 - 0:02',
        durationSec: 2.0,
        title: 'Drop Announcement & Packaging',
        action: 'Hand holds up sun stick packaging against clean background. Overlay: "Sun Stick just dropped 💛".',
        cameraAngle: 'Eye-level macro close-up',
        overlayText: 'Sun Stick just dropped 💛',
      },
      {
        timeRange: '0:02 - 0:05',
        durationSec: 3.0,
        title: 'Split-Screen Glide & Finish Test',
        action: 'Upper screen glides Glow Stick leaving radiant sheen; lower screen glides Matte Stick leaving blurred velvet finish.',
        cameraAngle: 'Split-screen macro over back of hand',
        overlayText: 'Glow ✨ vs. Matte 🌿',
      },
    ],
    buildKlingPrompt: (productSpec, brandName) =>
      renderTemplate('video/sun_stick_dual_finish.jinja', { productSpec, brandName }),
    buildUGCSpec: (productSpec, brandName) => {
      const brand = brandName || 'Target';
      return {
        durationMode: 'five_second_single_clip',
        aspectRatio: '9:16',
        audio: 'none',
        referenceVideoId: 'ref-video-sun-stick-dual-finish.mp4',
        productIdentityVersion: productSpec.productIdentityVersion,
        shots: [
          {
            duration: 2.0,
            framing: 'Handheld macro presentation of dual sun sticks',
            action: `Hand presents ${brand} Glow and Matte sun sticks in clean studio daylight`,
            cameraMotion: 'Subtle tilt down to skin testing area',
            texturePhysics: 'Solid stick balm melting effortlessly on contact',
            lighting: '5500K clean daylight',
            overlayCopy: 'Just dropped 💛',
            transition: 'Split-screen wipe',
          },
          {
            duration: 3.0,
            framing: 'Split macro comparison on skin finish',
            action: `Dual glide across skin: upper half reveals radiant glass-skin glow, lower half reveals velvet shine-free blur`,
            cameraMotion: 'Smooth panning across finished swatches',
            texturePhysics: 'Non-greasy, lightweight balm gliding seamlessly',
            lighting: 'Even daylight highlight',
            overlayCopy: 'Glow ✨ vs. Matte 🌿',
            transition: 'Fade to brand lockup',
          },
        ],
        claimsPolicy: 'Descriptive cosmetic finishes (glow vs matte) only.',
        negativeConstraints: 'No greasy oil pooling, no white residue, no chalky drag.',
      };
    },
  },

  'asmr-beauty-recipe': {
    id: 'asmr-beauty-recipe',
    title: 'ASMR Korean Bingsu Dessert Beauty Recipe',
    format: 'sensory_asmr_recipe',
    referenceVideoFilename: 'ref-video-asmr-bingsu-recipe.mp4',
    masterPrompt: `A vertical (9:16) ASMR creative beauty recipe video mimicking a Korean red bean bingsu (shaved ice dessert) using skincare products. Set on a shimmering, translucent pink silk fabric background scattered with raw red adzuki beans. A hand scoops a purple clay mask with an ice cream scoop into a glass dessert bowl, tops it with clear gel, dispenses serum, adds ice cubes, sprinkles red beans on top, and inserts a clear spoon. Soft pastel lighting, playful pop-art sound effects, high-sensory visual aesthetics.`,
    hook: {
      title: 'Skincare Dessert Recipe Hook',
      copy: "let's make bingsu for your pores 🍨",
      visualConcept: 'Playful culinary dessert visual concept scooping clay mask and drizzling gel serum into a glass dessert bowl.',
    },
    valueProp: 'Demonstrates multi-product textures (rich clay, fluid gel, concentrated serum) in a hypnotic ASMR format.',
    lightingConfig: {
      style: 'High-key, pastel commercial lighting creating bright reflections on glass surfaces and silk textures.',
      keyLight: '200W daylight LED with large softbox placed at 45° top-front angle.',
      fillLight: 'White reflector opposite key light to soften shadows around glass bowl base.',
      accentLight: 'Low-intensity soft LED panel hitting pink silk cloth to create glistening highlights.',
      colorTemperature: 'Neutral daylight (~5600K)',
    },
    cameraHardware: {
      camera: 'Mirrorless camera (Sony A7S III / FX3) mounted on a counterbalanced boom arm.',
      lens: '50mm f/2.8 Macro or 90mm Macro Lens for tight texture captures.',
      rigging: 'Counterbalanced overhead boom arm.',
      settings: {
        frameRate: '60 fps (downsampled to 30 fps)',
        shutterSpeed: '1/120s',
        aperture: 'f/4 - f/5.6',
        iso: '100 - 300',
      },
      props: [
        'Glass dessert footed bowl',
        'Metal mechanical ice cream scoop',
        'Clear glass dessert spoon',
        'Raw red adzuki beans / botanicals',
        'Acrylic clear ice cubes',
        'Shimmering pink silk backdrop cloth',
      ],
      editingTechnique: 'Macro texture cuts with tactile ASMR sound emphasis.',
    },
    shots: [
      {
        timeRange: '0:00 - 0:01',
        durationSec: 1.0,
        title: 'Finished Dessert Hook',
        action: 'Hero shot of completed skincare bingsu bowl with clear spoon inserted.',
        cameraAngle: '45° high-angle close-up',
        overlayText: "let's make bingsu for your pores 🍨",
      },
      {
        timeRange: '0:01 - 0:03',
        durationSec: 2.0,
        title: 'Clay Mask Ice Cream Scoop',
        action: 'Hand uses metal ice cream scoop to release dense purple clay scoop into glass dessert bowl.',
        cameraAngle: '45° high-angle macro shot tracking scoop motion',
        overlayText: 'Pore mask / sebum control',
      },
      {
        timeRange: '0:03 - 0:05',
        durationSec: 2.0,
        title: 'Water Gel & Serum Drizzle',
        action: 'Hand squeezes clear hydrating gel over scoops like syrup, followed by dropper serum drizzle and adzuki bean garnish.',
        cameraAngle: 'Tight macro close-up on dropper tip and gel stream',
        overlayText: 'Refreshing hydration & refining care ✨',
      },
    ],
    buildKlingPrompt: (productSpec, brandName) =>
      renderTemplate('video/asmr_bingsu_recipe.jinja', { productSpec, brandName }),
    buildUGCSpec: (productSpec, brandName) => {
      const brand = brandName || 'Target';
      return {
        durationMode: 'five_second_single_clip',
        aspectRatio: '9:16',
        audio: 'none',
        referenceVideoId: 'ref-video-asmr-bingsu-recipe.mp4',
        productIdentityVersion: productSpec.productIdentityVersion,
        shots: [
          {
            duration: 2.5,
            framing: '45° macro close-up over footed glass dessert bowl',
            action: `Metal mechanical scoop places dense velvety scoops of ${brand} ${productSpec.productType} into crystal bowl`,
            cameraMotion: 'Gentle arc tracking scoop motion',
            texturePhysics: 'Dense, luscious, whipped clay/cream texture holding sculptural shape',
            lighting: '5600K pastel high-key lighting over pink silk textile',
            overlayCopy: "dessert for your pores 🍨",
            transition: 'Macro whip-pan to syrup drizzle',
          },
          {
            duration: 2.5,
            framing: 'Tight macro on crystal glass bowl with garnish',
            action: `Hydrating fluid drizzles over scoops, clear acrylic ice cubes placed gently with tweezers`,
            cameraMotion: 'Slow ascending reveal of completed beauty recipe',
            texturePhysics: 'Glistening translucent gel syrup over rich formulation',
            lighting: 'High-contrast sparkling rim light on glass facets',
            overlayCopy: 'Pore soothing ritual ✨',
            transition: 'Clean fade out',
          },
        ],
        claimsPolicy: 'Tactile sensory aesthetic and pore soothing ritual only.',
        negativeConstraints: 'No real food contamination, no messy spilling off the bowl, no plastic reflection glare obscuring brand.',
      };
    },
  },

  'problem-solution-invisible-swatch': {
    id: 'problem-solution-invisible-swatch',
    title: 'Problem-to-Solution Invisible Skin Swatch',
    format: 'problem_solution_swatch',
    referenceVideoFilename: 'ref-video-problem-solution-invisible-swatch.mp4',
    masterPrompt: `A vertical (9:16) direct-response sunscreen comparison and demo video set in a bright indoor room with natural window lighting. Begins with a three-photo collage of common sunscreen issues (clogged pores, white cast, greasy shine) before transitioning to hand-held product reveals and close-up skin application swatches. Direct, clean, lifestyle beauty aesthetic focusing on lightweight texture, fast absorption, and invisible finishing.`,
    hook: {
      title: 'Problem Pain-Point Collage',
      copy: 'If you hate heavy formulas because they look like this... try this instead ✨',
      visualConcept: 'Static 3-photo collage of common skincare pain points (white cast, greasy sheen, pilling) converting to solution reveal.',
    },
    valueProp: 'Reassures consumers struggling with heavy, greasy products by highlighting a light, zero-weight formula leaving a natural, invisible finish.',
    lightingConfig: {
      style: 'Soft, natural indoor daylight (window key light) giving a realistic lifestyle feel.',
      keyLight: 'Large natural side-window light coming from left/top-left (~5500K daylight).',
      fillLight: 'Ambient room reflection / white wall on right to keep shadows soft without harsh contrast.',
      colorTemperature: 'Neutral daylight (~5500K)',
    },
    cameraHardware: {
      camera: 'Smartphone (iPhone 14/15/16 Pro at 4K 60fps) or mirrorless camera (Sony A7 IV / Canon R6 II) handheld.',
      lens: '35mm to 50mm Prime lens (natural perspective with soft background blur).',
      rigging: 'Handheld with subtle organic movement.',
      settings: {
        frameRate: '60 fps (fluid movement during liquid squeeze and blending)',
        shutterSpeed: '1/120s',
        aperture: 'f/2.8 - f/4 (smooth separation from background room elements)',
        iso: '100 - 400',
      },
      props: [
        'Product container / tube',
        'Clean bare hands',
        'Indoor plant / neutral background decor',
      ],
      editingTechnique: 'Direct-response split-second hook cut into continuous application demo.',
    },
    shots: [
      {
        timeRange: '0:00 - 0:01',
        durationSec: 1.0,
        title: 'Problem Hook Collage',
        action: 'Static 3-photo collage of white cast and greasy skin. Overlay: "If you hate SPF because it looks like this...".',
        cameraAngle: 'Graphic overlay screen over ambient room',
        overlayText: 'If you hate heavy SPF...',
      },
      {
        timeRange: '0:01 - 0:02',
        durationSec: 1.0,
        title: 'Solution Reveal',
        action: 'Hand holds up product container into frame. Overlay: "try this instead ✨".',
        cameraAngle: 'Eye-level handheld medium shot',
        overlayText: 'try this instead ✨',
      },
      {
        timeRange: '0:02 - 0:04',
        durationSec: 2.0,
        title: 'Application & Blending',
        action: 'Product dispenses onto back of hand; fingers rub lotion into skin, instantly turning translucent without white cast.',
        cameraAngle: '45° macro close-up tracking application motion',
        overlayText: '✅ zero white cast ✅ feels like nothing',
      },
      {
        timeRange: '0:04 - 0:05',
        durationSec: 1.0,
        title: 'Invisible Finish Reveal',
        action: 'Hand turns slightly under natural light, showing soft, non-greasy, natural skin finish.',
        cameraAngle: 'Locked macro shot',
        overlayText: 'barely-there finish ✨',
      },
    ],
    buildKlingPrompt: (productSpec, brandName) =>
      renderTemplate('video/problem_solution_invisible_swatch.jinja', { productSpec, brandName }),
    buildUGCSpec: (productSpec, brandName) => {
      const brand = brandName || 'Target';
      return {
        durationMode: 'five_second_single_clip',
        aspectRatio: '9:16',
        audio: 'none',
        referenceVideoId: 'ref-video-problem-solution-invisible-swatch.mp4',
        productIdentityVersion: productSpec.productIdentityVersion,
        shots: [
          {
            duration: 2.0,
            framing: 'Handheld medium close-up in soft window light',
            action: `Hand presents ${brand} ${productSpec.formFactor} container, dispenses drop of lotion onto skin`,
            cameraMotion: 'Organic handheld stabilization with gentle tilt down to hand',
            texturePhysics: productSpec.textureAndViscosity,
            lighting: 'Soft natural daylight from side window (5500K)',
            overlayCopy: 'If you hate greasy formulas... try this ✨',
            transition: 'Match cut to skin blend',
          },
          {
            duration: 3.0,
            framing: 'Macro 45° close-up of skin swatch blending',
            action: `Fingers blend product into skin; formula absorbs seamlessly with zero white cast and subtle natural radiance`,
            cameraMotion: 'Subtle tilt showing skin reflect light naturally',
            texturePhysics: 'Fast-absorbing, non-sticky, weightless finish',
            lighting: 'Soft diffused natural room daylight',
            overlayCopy: 'Feels like wearing nothing ✅',
            transition: 'Clean fade to brand logo',
          },
        ],
        claimsPolicy: 'Non-comedogenic sensory feel and invisible finish only. No unverified clinical assertions.',
        negativeConstraints: 'No heavy artificial blurring, no fake CGI skin textures, no morphing hand anatomy.',
      };
    },
  },

  'skin-1004-soothing-dispense': {
    id: 'skin-1004-soothing-dispense',
    title: 'Skin Soothing Ampoule Precision Dispense',
    format: 'soothing_ampoule_dispense',
    referenceVideoFilename: 'ref-video-skin-1004-soothing-dispense.mp4',
    masterPrompt: `Cinematic vertical 9:16 macro application demo of soothing barrier care formula. Top text reads: "struggling with irritated skin? try this!". Extreme macro shot of the precision nozzle dispenser of the tube. A honey-gold, translucent soothing ampoule/gel droplet dispenses smoothly onto a clean index fingertip. The formula holds a clear teardrop shape under soft directional side-lighting, displaying pure formulation clarity and rich barrier comfort. Gentle fingertip patting demonstrates instant calming melt and non-sticky skin soothing. Macro 100mm lens, f/2.8, warm 4500K morning sunlight, ASMR dispensing tactile feel.`,
    hook: {
      title: 'Irritated Skin Pain-Point Hook',
      copy: 'struggling with irritated skin? try this! 💧',
      visualConcept: 'Extreme macro slow-motion droplet dispensing of golden soothing gel onto fingertip to trigger immediate calming relief.',
    },
    valueProp: 'Visualizes high-purity, viscous barrier repair fluid holding droplet structure before effortlessly melting into irritated skin.',
    lightingConfig: {
      style: 'Warm, luminous back-and-side lighting (4500K) making the golden droplet glow with internal refraction.',
      keyLight: 'Directional 4500K warm soft light from 45° rear-left.',
      fillLight: 'Gentle frontal reflector to soften shadows on index fingertip.',
      colorTemperature: 'Warm neutral (~4500K)',
    },
    cameraHardware: {
      camera: 'Cinema camera or mirrorless with 100mm macro lens capable of 60-120fps.',
      lens: '100mm f/2.8 Macro lens.',
      rigging: 'Stable desktop mount with micro-slider.',
      settings: {
        frameRate: '60 fps',
        shutterSpeed: '1/120s',
        aperture: 'f/2.8 - f/4',
        iso: '100 - 300',
      },
      props: [
        'Soothing ampoule tube with precision nozzle',
        'Clean bare index finger',
      ],
      editingTechnique: 'High-speed macro capture of droplet bead formation and skin contact melt.',
    },
    shots: [
      {
        timeRange: '0:00 - 0:02',
        durationSec: 2.0,
        title: 'Precision Droplet Dispense',
        action: 'Extreme macro nozzle shot as honey-gold teardrop droplet dispenses onto index fingertip.',
        cameraAngle: 'Extreme macro close-up (100mm)',
        overlayText: 'struggling with irritated skin? try this!',
      },
      {
        timeRange: '0:02 - 0:05',
        durationSec: 3.0,
        title: 'Calming Melt & Soothe',
        action: 'Fingertip gently taps skin; droplet breaks into watery barrier comfort and calms redness immediately.',
        cameraAngle: '45° macro tracking finger tap',
        overlayText: 'Instant barrier calm 🌿',
      },
    ],
    buildKlingPrompt: (productSpec, brandName) =>
      renderTemplate('video/skin_1004_soothing_dispense.jinja', { productSpec, brandName }),
    buildUGCSpec: (productSpec, brandName) => {
      const brand = brandName || 'Target';
      return {
        durationMode: 'five_second_single_clip',
        aspectRatio: '9:16',
        audio: 'none',
        referenceVideoId: 'ref-video-skin-1004-soothing-dispense.mp4',
        productIdentityVersion: productSpec.productIdentityVersion,
        shots: [
          {
            duration: 2.5,
            framing: 'Extreme macro 100mm close-up on precision tube nozzle',
            action: `Tube gently compresses; translucent droplet of ${brand} ${productSpec.productType} beads onto fingertip`,
            cameraMotion: 'Micro-push into droplet refraction',
            texturePhysics: 'High-clarity viscous droplet with smooth surface tension',
            lighting: 'Warm 4500K golden backlight',
            overlayCopy: 'struggling with irritated skin? try this! 💧',
            transition: 'Direct cut to skin tap',
          },
          {
            duration: 2.5,
            framing: 'Macro 45° on skin calming melt',
            action: `Fingertip taps formula into skin, melting instantly into a refreshing cooling moisture layer`,
            cameraMotion: 'Subtle tilt up to rested container',
            texturePhysics: 'Non-sticky rapid skin absorption',
            lighting: 'Diffused soothing daylight',
            overlayCopy: 'Instant barrier calm 🌿',
            transition: 'Fade to brand lockup',
          },
        ],
        claimsPolicy: 'Descriptive cosmetic soothing and barrier hydration only.',
        negativeConstraints: 'No chemical burn visuals, no exaggerated CGI cartoon skin textures.',
      };
    },
  },
};

/**
 * Intelligent blueprint selector:
 * Inspects user request, brief text, and product spec to pick the optimal viral video blueprint.
 */
export function selectVideoBlueprint(
  productSpec: ProductIdentitySpec,
  requestedId?: string,
  briefText?: string
): VideoProductionBlueprint {
  if (requestedId && VIDEO_BLUEPRINTS[requestedId as BlueprintId]) {
    return VIDEO_BLUEPRINTS[requestedId as BlueprintId];
  }

  const query = `${briefText || ''} ${productSpec.productType} ${productSpec.textureAndViscosity} ${productSpec.labelLayoutAndApprovedCopy}`.toLowerCase();

  if (query.includes('egg') || query.includes('coverage test') || query.includes('eggshell') || query.includes('tinted') || query.includes('coverage')) {
    return VIDEO_BLUEPRINTS['egg-coverage-test'];
  }

  if (query.includes('underwater') || query.includes('bubble') || query.includes('aqua') || query.includes('splash') || query.includes('water tank')) {
    return VIDEO_BLUEPRINTS['underwater-bubble-hydration'];
  }

  if (query.includes('tap') || query.includes('swap') || query.includes('seasonal') || query.includes('routine') || query.includes('september') || query.includes('fall')) {
    return VIDEO_BLUEPRINTS['seasonal-tap-swap'];
  }

  if (query.includes('stick') || query.includes('glow sun') || query.includes('matte sun') || query.includes('dual finish')) {
    return VIDEO_BLUEPRINTS['sun-stick-dual-finish'];
  }

  if (query.includes('bingsu') || query.includes('asmr') || query.includes('dessert') || query.includes('recipe') || query.includes('scoop') || query.includes('pore mask') || query.includes('clay')) {
    return VIDEO_BLUEPRINTS['asmr-beauty-recipe'];
  }

  if (query.includes('soothing') || query.includes('cica') || query.includes('centella') || query.includes('irritat') || query.includes('skin 1004') || query.includes('skin1004')) {
    return VIDEO_BLUEPRINTS['skin-1004-soothing-dispense'];
  }

  if (query.includes('problem') || query.includes('swatch') || query.includes('white cast') || query.includes('greasy') || query.includes('invisible')) {
    return VIDEO_BLUEPRINTS['problem-solution-invisible-swatch'];
  }

  // Domain heuristic defaults based on product type:
  if (productSpec.productType === 'sunscreen') {
    return VIDEO_BLUEPRINTS['problem-solution-invisible-swatch'];
  }
  if (productSpec.productType === 'serum' || productSpec.productType === 'toner') {
    return VIDEO_BLUEPRINTS['skin-1004-soothing-dispense'];
  }
  if (productSpec.formFactor === 'jar') {
    return VIDEO_BLUEPRINTS['asmr-beauty-recipe'];
  }

  return VIDEO_BLUEPRINTS['problem-solution-invisible-swatch'];
}
