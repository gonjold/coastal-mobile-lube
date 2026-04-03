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

export const images = {
  logo: "v1774315498/Coastal_Lube_logo_v1_zbx9qs.png",
  vanMockup: "v1774317068/Van_mockup_ln68oh.png",
  vanMockupTransparent: "v1774317068/Van_mockup_transparent_bd5z75.png",
  heroVanDriveway: "v1774318456/hero-van-driveway_nag1pq.jpg",
  heroVanDrivewayAlt: "v1774318456/hero-van-driveway-alt_mil6jl.jpg",
  fleetVehicles: "v1774318456/fleet-vehicles_cjciux.jpg",
  fleetVehiclesAlt: "v1774318456/fleet-vehicles-alt_n85acn.jpg",
  marinaBoats: "v1774318456/marina-boats_daijbf.jpg",
  marinaBoatsAlt: "v1774318456/marina-boats-alt_ilx2op.jpg",
  oilChangeService: "v1774318456/oil-change-service_zptify.jpg",
  oilChangeServiceAlt: "v1774318456/oil-change-service-alt_q3ziwb.jpg",
  tireService: "v1774318456/tire-service_kezdax.jpg",
  vanInteriorEquipment: "v1774318456/van-interior-equipment_u2gu99.jpg",
  drivewayService: "v1774318456/driveway-service_sceizn.jpg",
  drivewayServiceAlt: "v1774318456/driveway-service-alt_uqmkou.jpg",
  commercialService: "v1774318456/commercial-service_wbgfog.jpg",
  commercialServiceAlt: "v1774318456/commercial-service-alt_xpwvoi.jpg",
  vanWrapSide: "coastal-van-wrap-side.png",
  vanWrapRear: "coastal-van-wrap-rear.png",
} as const;
