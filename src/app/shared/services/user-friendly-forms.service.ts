import { Injectable } from '@angular/core';

export interface FormHelp {
  fieldName: string;
  label: string;
  placeholder: string;
  helpText: string;
  errorMessage: string;
  example?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserFriendlyFormsService {

  private posFormHelp: { [key: string]: FormHelp } = {
    pos_uuid: {
      fieldName: 'pos_uuid',
      label: 'Point de vente visité',
      placeholder: '🏪 Recherchez le nom du magasin que vous visitez...',
      helpText: 'Sélectionnez le magasin ou point de vente que vous visitez dans votre liste de tâches du jour',
      errorMessage: 'Veuillez sélectionner le point de vente que vous visitez',
      example: 'Ex: Boutique Centrale, Magasin du Marché'
    },
    price: {
      fieldName: 'price',
      label: 'Coût de la visite',
      placeholder: '💰 Choisissez le tarif de votre visite...',
      helpText: 'Sélectionnez le montant correspondant au type de visite effectuée (simple, détaillée, avec formation, etc.)',
      errorMessage: 'Veuillez sélectionner le coût de votre visite',
      example: 'Le tarif dépend de la durée et du type de visite'
    },
    comment: {
      fieldName: 'comment',
      label: 'Commentaires et observations',
      placeholder: '💬 Décrivez votre visite : état du magasin, accueil du vendeur, produits observés, suggestions...',
      helpText: 'Décrivez tout ce que vous avez observé : état du magasin, accueil, problèmes rencontrés, suggestions d\'amélioration',
      errorMessage: 'Veuillez ajouter vos commentaires sur cette visite',
      example: '"Bon accueil, magasin propre, manque de produits XYZ", "Vendeur demande formation sur nouveaux produits"'
    },
    brand_uuid: {
      fieldName: 'brand_uuid',
      label: 'Marque observée',
      placeholder: '🔍 Recherchez et sélectionnez une marque...',
      helpText: 'Sélectionnez la marque de produits que vous avez observée dans ce point de vente',
      errorMessage: 'Veuillez sélectionner une marque',
      example: 'Coca-Cola, Sprite, Fanta, etc.'
    },
    number_farde: {
      fieldName: 'number_farde',
      label: 'Nombre de cartons/fardes présents',
      placeholder: 'Ex: 5',
      helpText: 'Comptez le nombre de cartons ou fardes de cette marque visibles dans le magasin',
      errorMessage: 'Veuillez indiquer le nombre de cartons/fardes présents',
      example: 'Comptez les emballages visibles sur les étagères et en stock'
    },
    sold: {
      fieldName: 'sold',
      label: 'Nombre de ventes réalisées',
      placeholder: 'Ex: 3',
      helpText: 'Demandez au vendeur combien d\'unités de cette marque ont été vendues aujourd\'hui',
      errorMessage: 'Veuillez indiquer le nombre de ventes réalisées',
      example: 'Indiquez 0 si aucune vente aujourd\'hui'
    }
  };

  private posHelp: { [key: string]: FormHelp } = {
    shop: {
      fieldName: 'shop',
      label: 'Nom du magasin',
      placeholder: 'Ex: Boutique Centrale, Magasin du Marché...',
      helpText: 'Saisissez le nom commercial du magasin tel qu\'il apparaît sur l\'enseigne',
      errorMessage: 'Veuillez saisir le nom du magasin',
      example: 'Le nom affiché sur la devanture du magasin'
    },
    name: {
      fieldName: 'name',
      label: 'Nom du propriétaire/vendeur',
      placeholder: 'Ex: Jean Dupont, Marie Kasongo...',
      helpText: 'Nom et prénom de la personne responsable du point de vente',
      errorMessage: 'Veuillez saisir le nom du responsable',
      example: 'La personne qui gère le magasin au quotidien'
    },
    gerant: {
      fieldName: 'gerant',
      label: 'Nom du gérant',
      placeholder: 'Ex: Pierre Martin...',
      helpText: 'Nom de la personne qui gère les opérations quotidiennes du magasin',
      errorMessage: 'Veuillez saisir le nom du gérant',
      example: 'Peut être différent du propriétaire'
    },
    telephone: {
      fieldName: 'telephone',
      label: 'Numéro de téléphone',
      placeholder: 'Ex: +243 123 456 789',
      helpText: 'Numéro de téléphone principal pour contacter le magasin',
      errorMessage: 'Veuillez saisir un numéro de téléphone valide',
      example: 'Format: +243 suivi du numéro'
    }
  };

  private userHelp: { [key: string]: FormHelp } = {
    fullname: {
      fieldName: 'fullname',
      label: 'Nom complet',
      placeholder: 'Ex: Jean-Pierre Kasongo',
      helpText: 'Saisissez votre nom complet (prénom et nom de famille)',
      errorMessage: 'Veuillez saisir votre nom complet',
      example: 'Comme sur votre pièce d\'identité'
    },
    email: {
      fieldName: 'email',
      label: 'Adresse email',
      placeholder: 'Ex: jean.kasongo@exemple.com',
      helpText: 'Adresse email valide pour recevoir les notifications',
      errorMessage: 'Veuillez saisir une adresse email valide',
      example: 'Format: utilisateur@domaine.com'
    },
    phone: {
      fieldName: 'phone',
      label: 'Numéro de téléphone',
      placeholder: 'Ex: +243 123 456 789',
      helpText: 'Votre numéro de téléphone principal',
      errorMessage: 'Veuillez saisir votre numéro de téléphone',
      example: 'Utilisé pour les notifications importantes'
    }
  };

  getFieldHelp(form: 'posform' | 'pos' | 'user', fieldName: string): FormHelp | null {
    switch (form) {
      case 'posform':
        return this.posFormHelp[fieldName] || null;
      case 'pos':
        return this.posHelp[fieldName] || null;
      case 'user':
        return this.userHelp[fieldName] || null;
      default:
        return null;
    }
  }

  getAllFormHelp(form: 'posform' | 'pos' | 'user'): { [key: string]: FormHelp } {
    switch (form) {
      case 'posform':
        return this.posFormHelp;
      case 'pos':
        return this.posHelp;
      case 'user':
        return this.userHelp;
      default:
        return {};
    }
  }

  getValidationMessage(form: 'posform' | 'pos' | 'user', fieldName: string, errorType: string): string {
    const fieldHelp = this.getFieldHelp(form, fieldName);
    
    if (!fieldHelp) {
      // Messages génériques par type d'erreur
      switch (errorType) {
        case 'required':
          return 'Ce champ est obligatoire';
        case 'email':
          return 'Veuillez saisir une adresse email valide';
        case 'minlength':
          return 'Ce champ est trop court';
        case 'maxlength':
          return 'Ce champ est trop long';
        case 'pattern':
          return 'Le format saisi n\'est pas correct';
        default:
          return 'Veuillez corriger cette erreur';
      }
    }

    // Messages spécifiques au champ
    switch (errorType) {
      case 'required':
        return fieldHelp.errorMessage;
      case 'email':
        return 'Veuillez saisir une adresse email valide (ex: nom@domaine.com)';
      case 'minlength':
        return `${fieldHelp.label} doit contenir plus de caractères`;
      case 'maxlength':
        return `${fieldHelp.label} est trop long`;
      case 'pattern':
        return `Le format de ${fieldHelp.label.toLowerCase()} n'est pas correct`;
      default:
        return fieldHelp.errorMessage;
    }
  }

  getSuccessMessages(): { [key: string]: string } {
    return {
      create: '✅ Enregistrement réussi ! Vos données ont été sauvegardées.',
      update: '✅ Modification réussie ! Vos changements ont été sauvegardés.',
      delete: '✅ Suppression réussie ! L\'élément a été supprimé.',
      submit: '✅ Envoi réussi ! Votre rapport a été transmis.',
      save: '✅ Sauvegarde réussie ! Vos données sont en sécurité.'
    };
  }

  getErrorMessages(): { [key: string]: string } {
    return {
      network: '❌ Problème de connexion. Vérifiez votre connexion internet et réessayez.',
      server: '❌ Erreur du serveur. Veuillez réessayer dans quelques instants.',
      validation: '❌ Veuillez corriger les erreurs dans le formulaire.',
      permission: '❌ Vous n\'avez pas les droits nécessaires pour cette action.',
      notFound: '❌ L\'élément recherché n\'a pas été trouvé.',
      conflict: '❌ Cette action n\'est pas possible car l\'élément a été modifié par quelqu\'un d\'autre.',
      generic: '❌ Une erreur inattendue s\'est produite. Veuillez réessayer.'
    };
  }
}
