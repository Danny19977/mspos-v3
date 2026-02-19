import { Injectable } from '@angular/core';
import { db, LocalUser } from '../shared/services/db';

export type { LocalUser };

@Injectable({
  providedIn: 'root'
})
export class LocalDbService {

  /**
   * Sauvegarde ou met à jour l'utilisateur authentifié
   */
  async saveAuthenticatedUser(
    identifier: string,
    passwordHash: string,
    token: string,
    userData: any
  ): Promise<void> {
    try {
      console.log('🔄 LocalDbService: Début de la sauvegarde dans IndexedDB');
      console.log('   - Identifier:', identifier);
      console.log('   - Token présent:', !!token);
      console.log('   - UserData présent:', !!userData);
      console.log('   - PasswordHash présent:', !!passwordHash);

      // On supprime tous les anciens utilisateurs d'abord
      const countBefore = await db.authUsers.count();
      console.log('   - Nombre d\'utilisateurs avant clear():', countBefore);
      
      await db.authUsers.clear();
      console.log('✅ IndexedDB: Table authUsers vidée');

      // On sauvegarde uniquement l'utilisateur actuel
      const userToSave = {
        identifier: identifier.toLowerCase(),
        passwordHash,
        token,
        userData,
        lastSync: new Date()
      };
      
      console.log('🔄 Objet à sauvegarder:', {
        ...userToSave,
        passwordHash: '[HIDDEN]',
        token: token.substring(0, 10) + '...'
      });

      const id = await db.authUsers.add(userToSave);
      console.log('✅ IndexedDB: Utilisateur ajouté avec l\'id:', id);

      // Vérification immédiate
      const countAfter = await db.authUsers.count();
      console.log('✅ Nombre d\'utilisateurs après add():', countAfter);

      if (countAfter === 0) {
        throw new Error('ERREUR: L\'utilisateur n\'a pas été sauvegardé dans IndexedDB!');
      }
    } catch (error) {
      console.error('❌ LocalDbService: Erreur lors de la sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Récupère l'utilisateur authentifié stocké localement
   */
  async getAuthenticatedUser(identifier: string): Promise<LocalUser | undefined> {
    return await db.authUsers
      .where('identifier')
      .equals(identifier.toLowerCase())
      .first();
  }

  /**
   * Vérifie si un utilisateur est stocké localement
   */
  async hasStoredUser(): Promise<boolean> {
    const count = await db.authUsers.count();
    return count > 0;
  }

  /**
   * Récupère le premier (et unique) utilisateur stocké
   */
  async getStoredUser(): Promise<LocalUser | undefined> {
    return await db.authUsers.toCollection().first();
  }

  /**
   * Supprime l'utilisateur stocké (lors du logout)
   */
  async clearUser(): Promise<void> {
    await db.authUsers.clear();
  }

  /**
   * Met à jour le token de l'utilisateur stocké
   */
  async updateToken(identifier: string, token: string): Promise<void> {
    const user = await this.getAuthenticatedUser(identifier);
    if (user && user.id) {
      await db.authUsers.update(user.id, {
        token,
        lastSync: new Date()
      });
    }
  }

  /**
   * Met à jour les données utilisateur
   */
  async updateUserData(identifier: string, userData: any): Promise<void> {
    const user = await this.getAuthenticatedUser(identifier);
    if (user && user.id) {
      await db.authUsers.update(user.id, {
        userData,
        lastSync: new Date()
      });
    }
  }
}
