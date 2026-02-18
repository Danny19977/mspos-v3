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
    // On supprime tous les anciens utilisateurs d'abord
    await db.authUsers.clear();

    // On sauvegarde uniquement l'utilisateur actuel
    await db.authUsers.add({
      identifier: identifier.toLowerCase(),
      passwordHash,
      token,
      userData,
      lastSync: new Date()
    });
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
