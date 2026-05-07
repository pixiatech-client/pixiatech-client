
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerUser } from '@/app/admin/actions';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const formSchema = z.object({
  displayName: z.string().min(2, "Le nom d'utilisateur est requis."),
  email: z.string().email("L'email est invalide."),
  phone: z.string().optional(),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères.'),
});

type FormValues = z.infer<typeof formSchema>;

function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    const result = await registerUser(data);

    if (result.success) {
      toast({
        title: 'Inscription réussie',
        description: "Votre compte est maintenant en attente d'approbation par un administrateur.",
        variant: 'success',
      });
      router.push('/admin/login');
    } else {
      setError(result.error || "Une erreur inconnue est survenue.");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="displayName">Nom complet</Label>
        <Input id="displayName" placeholder="Jean Dupont" {...form.register('displayName')} />
        {form.formState.errors.displayName && <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="jean.dupont@example.com" {...form.register('email')} />
         {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
      </div>
       <div className="space-y-2">
        <Label htmlFor="phone">Numéro de téléphone</Label>
        <Input id="phone" type="tel" placeholder="+33612345678" {...form.register('phone')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
            <Input 
                id="password" 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••" 
                {...form.register('password')} 
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
            >
                {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
            </Button>
        </div>
         {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
      </div>
      
      {error && <p className="text-sm text-destructive">{error}</p>}
      
      <div className="flex flex-col gap-4 pt-2">
        <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
           {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "S'inscrire"}
        </Button>
      </div>
    </form>
  );
}


export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-muted/40 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div
          className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl">
        </div>
        <Card className="relative shadow-lg sm:rounded-3xl sm:p-8 max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Créer un compte</CardTitle>
            <CardDescription>
              Rejoignez la plateforme pour créer des estimations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
           <CardFooter className="flex-col gap-4 items-center text-sm pt-6">
            <p>Déjà un compte? <Link href="/admin/login" className="font-semibold underline">Se connecter</Link></p>
            <Button variant="link" asChild className="text-muted-foreground mt-4">
              <Link href="/"><ArrowLeft className="mr-2 h-4 w-4"/> Retour au site</Link>
          </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
