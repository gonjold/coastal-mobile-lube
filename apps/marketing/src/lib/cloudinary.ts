const CLOUD_NAME = "dgcdcqjrz";

interface CloudinaryOptions {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
}

export function cloudinaryUrl(
  publicId: string,
  options: CloudinaryOptions = {}
): string {
  const {
    width = 800,
    height,
    crop = "fill",
    quality = "auto:good",
    format = "auto",
  } = options;

  const transforms: string[] = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop) transforms.push(`c_${crop}`);
  if (quality) transforms.push(`q_${quality}`);
  if (format) transforms.push(`f_${format}`);

  const transformString = transforms.length > 0 ? transforms.join(",") + "/" : "";

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformString}${publicId}`;
}

const TRANSFORMS = {
  hero: "f_auto,q_auto:good,w_1920,c_fill,g_center",
  heroSection: "f_auto,q_auto:good,w_1600,c_fill",
  heroImproved: "f_auto,q_auto:good,w_1920,c_fill,g_center,e_improve",
  card43: "f_auto,q_auto:good,w_800,c_fill,ar_4:3",
  card34: "f_auto,q_auto:good,w_600,c_fill,ar_3:4",
  square: "f_auto,q_auto:good,w_600,c_fill,ar_1:1,g_auto",
  feature: "f_auto,q_auto:good,w_900,c_fill,ar_1:1",
  mobileHero: "f_auto,q_auto:good,w_900,c_fill,g_auto,ar_4:5",
  blurredBg: "f_auto,q_auto:eco,w_1920,c_fill,e_blur:200",
  inline: "f_auto,q_auto:good,w_1200,c_fill,ar_16:9",
  gridTile: "f_auto,q_auto:good,w_600,c_fill,ar_3:4",
} as const;

export type TransformKey = keyof typeof TRANSFORMS;

export function cld(publicId: string, variant: TransformKey): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${TRANSFORMS[variant]}/${publicId}`;
}

export const images = {
  // Brand assets — preserved
  logo: "v1774315498/Coastal_Lube_logo_v1_zbx9qs.png",
  vanMockup: "v1774317068/Van_mockup_ln68oh.png",
  vanMockupTransparent: "v1774317068/Van_mockup_transparent_bd5z75.png",
  vanWrapSide: "coastal-van-wrap-side.png",
  vanWrapRear: "coastal-van-wrap-rear.png",

  // V2 hero photos
  heroHome: "v1777313741/01-hero-home-sunset-vans-wide_e1mmkz.png",
  heroAbout: "v1777313744/02-hero-about-sunset-vans_jidrza.png",
  heroHowItWorks: "v1777313747/03-hero-howitworks-van-equipment-wide_rhwajm.png",
  heroServices: "v1777313744/04-hero-fleet-services-vans-posed_pzdtrt.png",
  heroFleet: "v1777313744/04-hero-fleet-services-vans-posed_pzdtrt.png",
  heroMarine: "v1777313741/01-hero-home-sunset-vans-wide_e1mmkz.png",
  heroRV: "v1777313744/05-hero-rv-vans-residential-street_imgayl.png",

  // Equipment + interiors
  vanEquipmentWide: "v1777313747/03-hero-howitworks-van-equipment-wide_rhwajm.png",
  vanEquipmentSquare: "v1777313743/03b-howitworks-van-equipment-square_cciimx.png",
  vanTireEquipment: "v1777313740/07-van-tire-equipment-clean_ecnvkb.png",
  vanVacuumExtraction: "v1777313741/08-van-vacuum-extraction-detail_wxpkqy.png",
  vanTireBay: "v1777313745/09-van-tire-bay-detail_zalijl.png",

  // Lifestyle / marketing
  vansResidentialDriveway: "v1777313746/06-vans-residential-driveway-palms_krdfi7.png",
  vansPosedPortrait: "v1777313739/04b-about-vans-posed-portrait_zxrydj.png",

  // Family / founder
  familyMarina: "v1777313743/10-about-jason-family-marina_pdxgki.png",
  daughterVan: "v1777313746/11-jason-daughter-van_n18fhi.png",

  // Real customer jobs
  realJobSienna: "v1777313789/coastal-real-customer-job-sienna_eazemn.jpg",

  // Legacy aliases — kept so existing call sites pick up V2 photos automatically
  // (mapping per WO-PHOTOS-V2-REAL §3 table)
  heroVanDriveway: "v1777313741/01-hero-home-sunset-vans-wide_e1mmkz.png",
  heroVanDrivewayAlt: "v1777313744/02-hero-about-sunset-vans_jidrza.png",
  vanInteriorEquipment: "v1777313747/03-hero-howitworks-van-equipment-wide_rhwajm.png",
  oilChangeService: "v1777313741/08-van-vacuum-extraction-detail_wxpkqy.png",
  oilChangeServiceAlt: "v1777313745/09-van-tire-bay-detail_zalijl.png",
  tireService: "v1777313740/07-van-tire-equipment-clean_ecnvkb.png",
  drivewayService: "v1777313746/06-vans-residential-driveway-palms_krdfi7.png",
  drivewayServiceAlt: "v1777313789/coastal-real-customer-job-sienna_eazemn.jpg",
  commercialService: "v1777313744/04-hero-fleet-services-vans-posed_pzdtrt.png",
  commercialServiceAlt: "v1777313739/04b-about-vans-posed-portrait_zxrydj.png",
  fleetVehicles: "v1777313744/04-hero-fleet-services-vans-posed_pzdtrt.png",
  fleetVehiclesAlt: "v1777313746/06-vans-residential-driveway-palms_krdfi7.png",
  marinaBoats: "v1777313741/01-hero-home-sunset-vans-wide_e1mmkz.png",
  marinaBoatsAlt: "v1777313744/02-hero-about-sunset-vans_jidrza.png",
} as const;
