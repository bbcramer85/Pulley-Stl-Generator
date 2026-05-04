const asset = (name) => `${import.meta.env.BASE_URL}assets/${encodeURIComponent(name)}`;

export const affiliateCardsByExportType = {
  stl: [
    {
      href: "https://amzn.to/3OBLLUC",
      image: asset("belt lacing.png"),
      alt: "Belt lacing",
      text: "Belt fasteners",
      aria: "Open belt fastener product link",
    },
    {
      href: "https://amzn.to/4tJgLkM",
      image: asset("2 inch wide flat belt.png"),
      alt: "2 inch wide flat belt",
      text: "2 inch wide flat belt",
      aria: "Open 2 inch wide flat belt product link",
    },
  ],
  dxf: [
    {
      href: "https://amzn.to/4tbXhEj",
      image: asset("laser.jpg"),
      alt: "Laser cutter",
      text: "Laser cutting tool",
      aria: "Open laser product link",
    },
    {
      href: "https://amzn.to/3QB0waS",
      image: asset("gasket.jpg"),
      alt: "Gasket material",
      text: "Gasket material",
      aria: "Open gasket material product link",
    },
  ],
};

export const primaryAffiliateByProject = {
  vBeltPulley: {
    href: "https://amzn.to/4t7NhMc",
    image: asset("linkbelt.jpg"),
    alt: "Link belt",
    text: "V-belt link belt",
    aria: "Open V-belt link belt product link",
  },
  sprocket: {
    href: "https://amzn.to/4n4oUNW",
    image: asset("chain.jpg"),
    alt: "Roller chain",
    text: "Roller chain",
    aria: "Open roller chain product link",
  },
  straightCutGear: {
    href: "https://amzn.to/4emyzxl",
    image: asset("bearing.jpg"),
    alt: "Bearing",
    text: "Bearings",
    aria: "Open bearing product link",
  },
  bevelGear: {
    href: "https://amzn.to/4emyzxl",
    image: asset("bearing.jpg"),
    alt: "Bearing",
    text: "Bearings",
    aria: "Open bearing product link",
  },
  shaftSpacer: {
    href: "https://amzn.to/4emyzxl",
    image: asset("bearing.jpg"),
    alt: "Bearing",
    text: "Bearings",
    aria: "Open bearing product link",
  },
};

export const secondaryAffiliateByProject = {
  sprocket: {
    href: "https://amzn.to/4w4FJfP",
    image: asset("conveyorchain.jpg"),
    alt: "Conveyor chain",
    text: "Conveyor chain",
    aria: "Open conveyor chain product link",
  },
  straightCutGear: {
    href: "https://amzn.to/3QWyJBG",
    image: asset("shaft.jpg"),
    alt: "Shaft stock",
    text: "Shaft stock",
    aria: "Open shaft stock product link",
  },
  bevelGear: {
    href: "https://amzn.to/3QWyJBG",
    image: asset("shaft.jpg"),
    alt: "Shaft stock",
    text: "Shaft stock",
    aria: "Open shaft stock product link",
  },
  shaftSpacer: {
    href: "https://amzn.to/3QWyJBG",
    image: asset("shaft.jpg"),
    alt: "Shaft stock",
    text: "Shaft stock",
    aria: "Open shaft stock product link",
  },
};

export const driveSupplyAffiliateCards = [
  {
    category: "Belt lacing",
    href: "https://amzn.to/3OBLLUC",
    image: asset("belt lacing.png"),
    alt: "Flat belt lacing",
    text: "Belt fasteners",
    aria: "Open belt fastener product link",
  },
  {
    category: "Flat belt",
    href: "https://amzn.to/4tJgLkM",
    image: asset("2 inch wide flat belt.png"),
    alt: "2 inch wide flat belt",
    text: "Flat belt stock",
    aria: "Open flat belt product link",
  },
  {
    category: "V-belt",
    href: "https://amzn.to/4t7NhMc",
    image: asset("linkbelt.jpg"),
    alt: "Link belt",
    text: "Link belt",
    aria: "Open V-belt link belt product link",
  },
  {
    category: "Chain",
    href: "https://amzn.to/4n4oUNW",
    image: asset("chain.jpg"),
    alt: "Roller chain",
    text: "Roller chain",
    aria: "Open roller chain product link",
  },
  {
    category: "Conveyor chain",
    href: "https://amzn.to/4w4FJfP",
    image: asset("conveyorchain.jpg"),
    alt: "Conveyor chain",
    text: "Conveyor chain",
    aria: "Open conveyor chain product link",
  },
  {
    category: "Shafts",
    href: "https://amzn.to/3QWyJBG",
    image: asset("shaft.jpg"),
    alt: "Shaft stock",
    text: "Shaft stock",
    aria: "Open shaft stock product link",
  },
  {
    category: "Bearings",
    href: "https://amzn.to/4emyzxl",
    image: asset("bearing.jpg"),
    alt: "Bearing",
    text: "Bearings",
    aria: "Open bearing product link",
  },
];

export function affiliateCardsFor(projectKey, exportType = "stl") {
  const baseCards = exportType === "dxf" ? affiliateCardsByExportType.dxf : affiliateCardsByExportType.stl;
  return [
    primaryAffiliateByProject[projectKey] || baseCards[0],
    secondaryAffiliateByProject[projectKey] || baseCards[1],
  ];
}
