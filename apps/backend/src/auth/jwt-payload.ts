/** Payload dei JWT emessi dal backend (access e refresh). */
export interface JwtPayload {
  /** id utente (ObjectId in esadecimale) */
  sub: string;
  householdId: string;
  /** distingue access da refresh: un refresh token non può autenticare una richiesta */
  type: 'access' | 'refresh';
}
