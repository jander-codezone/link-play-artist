// Planes para Artistas (LIVE mode)
export const ARTISTA_TIERS = {
  standard: {
    name: "Estándar",
    price: 12.99,
    price_id: "price_1Sx5xvGOghH19qqnSM4g4fw2",
    product_id: "prod_TuvpOUln1fZy8c",
    features: [
      "Calendario de eventos",
      "Gestión de disponibilidad",
      "Notificaciones por email",
      "Estadísticas básicas",
      "Soporte estándar",
    ],
    limitations: [
      "Estadísticas avanzadas no disponibles",
      "Soporte en 48h",
    ],
  },
  premium: {
    name: "Premium",
    price: 19.99,
    price_id: "price_1Sx5y8GOghH19qqnf0h0Abmy",
    product_id: "prod_TuvpqMYFy4CXv0",
    features: [
      "Calendario de eventos premium",
      "Gestión de disponibilidad avanzada",
      "Notificaciones en tiempo real",
      "Estadísticas avanzadas y reportes",
      "Soporte prioritario 24/7",
      "Exportación de datos",
      "Perfil destacado",
    ],
    limitations: [],
  },
} as const;

// Planes para Representantes (LIVE mode)
export const REPRESENTANTE_TIERS = {
  standard: {
    name: "Estándar",
    price: 100,
    price_id: "price_1Sx5yLGOghH19qqnsrxwCLsT",
    product_id: "prod_TuvqaHLOmtLKig",
    features: [
      "Gestión de hasta 10 artistas",
      "Calendario compartido",
      "Estadísticas por artista",
      "Notificaciones por email",
      "Soporte estándar",
    ],
    limitations: [
      "Artistas limitados a 10",
      "Estadísticas avanzadas no disponibles",
      "Soporte en 48h",
    ],
  },
  premium: {
    name: "Premium",
    price: 150,
    price_id: "price_1Sx5ycGOghH19qqnAGatoqlb",
    product_id: "prod_Tuvqjn2ALdsXPu",
    features: [
      "Gestión ilimitada de artistas",
      "Calendario compartido avanzado",
      "Estadísticas avanzadas y reportes",
      "Notificaciones en tiempo real",
      "Soporte prioritario 24/7",
      "Exportación de datos",
      "API access",
      "Perfiles destacados para todos tus artistas",
    ],
    limitations: [],
  },
} as const;

export type SubscriptionTier = "standard" | "premium";
export type UserType = "artista" | "representante";

export function getTiersForUserType(userType: UserType) {
  return userType === "representante" ? REPRESENTANTE_TIERS : ARTISTA_TIERS;
}

export function getTierByProductId(productId: string): { tier: SubscriptionTier; userType: UserType } | null {
  // Artista
  if (productId === ARTISTA_TIERS.standard.product_id) return { tier: "standard", userType: "artista" };
  if (productId === ARTISTA_TIERS.premium.product_id) return { tier: "premium", userType: "artista" };
  // Representante
  if (productId === REPRESENTANTE_TIERS.standard.product_id) return { tier: "standard", userType: "representante" };
  if (productId === REPRESENTANTE_TIERS.premium.product_id) return { tier: "premium", userType: "representante" };
  return null;
}

// Trial de 1 mes gratis
export const TRIAL_DAYS = 30;
