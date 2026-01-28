import Dexie, { Table } from 'dexie';
import { Injectable } from '@angular/core';

export interface LocalUser {
  id?: number;
  identifier: string; // email ou username
  passwordHash: string;
  token: string;
  userData: any; // Informations complètes de l'utilisateur
  lastSync: Date;
}

@Injectable({
  providedIn: 'root'
})
export class LocalDbService extends Dexie {
  users!: Table<LocalUser, number>;

  constructor() {
    super('MSPOSAuthDB');
    
    this.version(1).stores({
      users: '++id, identifier'
    });
  }

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
    await this.users.clear();
    
    // On sauvegarde uniquement l'utilisateur actuel
    await this.users.add({
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
    return await this.users
      .where('identifier')
      .equals(identifier.toLowerCase())
      .first();
  }

  /**
   * Vérifie si un utilisateur est stocké localement
   */
  async hasStoredUser(): Promise<boolean> {
    const count = await this.users.count();
    return count > 0;
  }

  /**
   * Récupère le premier (et unique) utilisateur stocké
   */
  async getStoredUser(): Promise<LocalUser | undefined> {
    return await this.users.toCollection().first();
  }

  /**
   * Supprime l'utilisateur stocké (lors du logout)
   */
  async clearUser(): Promise<void> {
    await this.users.clear();
  }

  /**
   * Met à jour le token de l'utilisateur stocké
   */
  async updateToken(identifier: string, token: string): Promise<void> {
    const user = await this.getAuthenticatedUser(identifier);
    if (user && user.id) {
      await this.users.update(user.id, {
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
      await this.users.update(user.id, {
        userData,
        lastSync: new Date()
      });
    }
  }
}
