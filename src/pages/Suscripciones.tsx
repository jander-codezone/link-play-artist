import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Loader2, RefreshCw, Settings, Sparkles, X, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getTiersForUserType, 
  getTierByProductId, 
  TRIAL_DAYS,
  type SubscriptionTier,
  type UserType 
} from "@/lib/subscription-tiers";

interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  price_id: string | null;
  subscription_end: string | null;
}

export default function Suscripciones() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

  const userType: UserType = profile?.tipo_usuario === "representante" ? "representante" : "artista";
  const tiers = getTiersForUserType(userType);

  const currentSubscription = subscription?.product_id 
    ? getTierByProductId(subscription.product_id) 
    : null;

  const currentTier = currentSubscription?.tier ?? null;

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: "¡Suscripción activada!",
        description: "Tu suscripción se ha activado correctamente.",
      });
    } else if (searchParams.get("canceled") === "true") {
      toast({
        title: "Pago cancelado",
        description: "El proceso de pago fue cancelado.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  const handleSubscribe = async (priceId: string) => {
    try {
      setCheckoutLoading(priceId);
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el proceso de pago.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening portal:", error);
      toast({
        title: "Error",
        description: "No se pudo abrir el portal de gestión.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suscripciones</h1>
            <p className="text-muted-foreground mt-1">
              {userType === "representante" 
                ? "Planes para representantes - Gestiona múltiples artistas"
                : "Planes para artistas - Potencia tu carrera"
              }
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={checkSubscription} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar estado
          </Button>
        </div>

        {/* Trial Banner */}
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Gift className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400">
                {TRIAL_DAYS} días de prueba gratis
              </p>
              <p className="text-sm text-muted-foreground">
                Acceso completo a todas las funcionalidades durante tu periodo de prueba
              </p>
            </div>
          </CardContent>
        </Card>

        {subscription?.subscribed && currentTier && (
          <Card className="border-primary bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Tu suscripción actual</CardTitle>
                </div>
                <Badge variant="default">Activa</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-xl">{tiers[currentTier].name}</p>
                  <p className="text-sm text-muted-foreground">
                    Próxima renovación: {subscription.subscription_end 
                      ? new Date(subscription.subscription_end).toLocaleDateString("es-ES")
                      : "N/A"}
                  </p>
                </div>
                <Button variant="outline" onClick={handleManageSubscription} disabled={portalLoading}>
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Gestionar suscripción
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:max-w-4xl lg:mx-auto">
          {/* Plan Estándar */}
          <Card className={`relative flex flex-col ${currentTier === "standard" ? "border-primary ring-2 ring-primary/20" : ""}`}>
            {currentTier === "standard" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">Tu plan actual</Badge>
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Estándar</CardTitle>
              <CardDescription>
                {userType === "representante" ? "Para representantes que empiezan" : "Para artistas individuales"}
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{tiers.standard.price}€</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Primer mes gratis
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {tiers.standard.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
                {tiers.standard.limitations.map((limitation, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <X className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                    <span className="text-sm">{limitation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className={cn(
                  "w-full",
                  currentTier !== "standard" && "bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
                )}
                variant={currentTier === "standard" ? "outline" : "default"}
                onClick={() => handleSubscribe(tiers.standard.price_id)}
                disabled={checkoutLoading !== null || currentTier === "standard"}
              >
                {checkoutLoading === tiers.standard.price_id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {currentTier === "standard" ? "Plan actual" : "Comenzar prueba gratuita"}
              </Button>
            </CardFooter>
          </Card>

          {/* Plan Premium */}
          <Card className={`relative flex flex-col border-2 ${currentTier === "premium" ? "border-primary ring-2 ring-primary/20" : "border-yellow-500/50"}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className={currentTier === "premium" ? "bg-primary" : "bg-yellow-500 text-yellow-950"}>
                {currentTier === "premium" ? "Tu plan actual" : "Recomendado"}
              </Badge>
            </div>
            <CardHeader className="text-center pb-2">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-2xl">Premium</CardTitle>
              </div>
              <CardDescription>
                {userType === "representante" ? "Para profesionales con alto volumen" : "Acceso completo para tu carrera"}
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{tiers.premium.price}€</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Primer mes gratis
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {tiers.premium.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
                onClick={() => handleSubscribe(tiers.premium.price_id)}
                disabled={checkoutLoading !== null || currentTier === "premium"}
              >
                {checkoutLoading === tiers.premium.price_id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {currentTier === "premium" ? "Plan actual" : "Comenzar prueba gratuita"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground lg:max-w-4xl mx-auto">
          <p>
            * La prueba gratuita dura 30 días. Después, se cobrará automáticamente según el plan elegido. 
            Puedes cancelar en cualquier momento desde el{" "}
            <a 
              href="/configuracion?tab=suscripcion" 
              className="text-blue-500 underline hover:text-blue-600"
            >
              portal de gestión de suscripciones
            </a>.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
