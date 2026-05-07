
'use client';

import { AlertTriangle, Home, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

interface EmergencyStopPageProps {
    returnUrl?: string;
    message?: string;
}

export function EmergencyStopPage({ returnUrl, message }: EmergencyStopPageProps) {
    const finalReturnUrl = returnUrl || '/';
    const displayMessage = message || "Pour des raisons de maintenance, notre outil d'estimation en ligne est actuellement suspendu. Veuillez nous excuser pour la gêne occasionnée.";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <div className="flex flex-col items-center justify-center bg-white border border-yellow-300 shadow-xl rounded-2xl p-8 md:p-12 max-w-2xl">
                <div className="bg-destructive text-destructive-foreground rounded-full p-4 mb-6">
                    <AlertTriangle className="h-10 w-10" />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-destructive mb-3">
                    Service Temporairement Indisponible
                </h1>
                <p className="text-muted-foreground text-lg mb-8">
                    {displayMessage}
                </p>
                <Button asChild variant="outline" size="lg">
                    <Link href={finalReturnUrl}>
                        <Home className="mr-2 h-5 w-5" />
                        Retour à la page d'accueil
                    </Link>
                </Button>
            </div>
            <div className="absolute bottom-4">
                <Button asChild variant="link" className="text-muted-foreground">
                    <Link href="/admin/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Accès Administrateur
                    </Link>
                </Button>
            </div>
        </div>
    );
}
