import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  constructor() { }

  /**
   * Hash un mot de passe avec SHA-256
   * @param password Le mot de passe à hasher
   * @returns Le hash en format hexadécimal
   */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Vérifie si un mot de passe correspond à un hash
   * @param password Le mot de passe à vérifier
   * @param hash Le hash de référence
   * @returns true si le mot de passe correspond
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  /**
   * Génère un hash pour un identifiant (email ou username) + mot de passe
   * Utile pour stocker l'empreinte complète
   */
  async hashCredentials(identifier: string, password: string): Promise<string> {
    const combined = `${identifier.toLowerCase()}:${password}`;
    return this.hashPassword(combined);
  }
}
