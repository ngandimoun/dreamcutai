import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Erreur d'authentification
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Une erreur s'est produite lors de la connexion avec Google.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-red-800">
              Causes possibles :
            </h3>
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
              <li>Le code d'autorisation a expiré</li>
              <li>Configuration incorrecte des URLs de redirection</li>
              <li>Problème de connexion avec Google</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-3">
            <Button asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                Réessayer la connexion
              </Link>
            </Button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Si le problème persiste, contactez le support technique.
          </p>
        </div>
      </div>
    </div>
  )
}
