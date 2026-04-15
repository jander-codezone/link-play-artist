import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logoLinkplay from '@/assets/logo-linkplay.png';

const profileSchema = z.object({
  nombre: z.string().trim().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }).max(100),
  telefono: z.string().optional(),
  tipo_usuario: z.enum(['venue', 'artista', 'representante'], { required_error: 'Selecciona un tipo de usuario' }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nombre: '',
      telefono: '',
      tipo_usuario: undefined,
    },
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }

      if (profile) {
        // User has profile, redirect to home
        navigate('/');
      } else {
        // User needs to complete profile
        setNeedsProfile(true);
        // Pre-fill name from Google if available
        if (user.user_metadata?.full_name) {
          form.setValue('nombre', user.user_metadata.full_name);
        } else if (user.user_metadata?.name) {
          form.setValue('nombre', user.user_metadata.name);
        }
      }
    }
  }, [user, profile, authLoading, navigate, form]);

  const handleSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsLoading(true);
    const { error } = await supabase.from('user_profiles').insert({
      user_id: user.id,
      nombre: data.nombre,
      email: user.email,
      telefono: data.telefono || null,
      tipo_usuario: data.tipo_usuario,
    });
    setIsLoading(false);

    if (error) {
      console.error('Error creating profile:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el perfil. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } else {
      await refreshProfile();
      toast({ title: 'Perfil creado', description: 'Bienvenido a Link&Play' });
      navigate('/');
    }
  };

  if (authLoading || (!needsProfile && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!needsProfile) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logoLinkplay} alt="Link&Play" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">Completa tu perfil</CardTitle>
          <CardDescription>
            Necesitamos algunos datos más para configurar tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo *</Label>
              <Input
                id="nombre"
                placeholder="Tu nombre"
                {...form.register('nombre')}
              />
              {form.formState.errors.nombre && (
                <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono (opcional)</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="+34 600 000 000"
                {...form.register('telefono')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de usuario *</Label>
              <Select
                onValueChange={(value: 'venue' | 'artista' | 'representante') =>
                  form.setValue('tipo_usuario', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="artista">Artista</SelectItem>
                  <SelectItem value="representante">Representante</SelectItem>
                  <SelectItem value="venue">Venue / Local</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.tipo_usuario && (
                <p className="text-sm text-destructive">{form.formState.errors.tipo_usuario.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Completar registro
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
