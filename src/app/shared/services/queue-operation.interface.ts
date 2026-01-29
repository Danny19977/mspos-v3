/**
 * Queue operation interface for offline sync
 */
export interface QueuedOperation {
  id?: number;
  operationId: string; // Unique identifier for the operation
  entityType: 'brand' | 'pos' | 'posform' | 'posformItem' | 'routeplan' | 'routeplanItem' | 'posequipment';
  operation: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  tempId?: string; // Temporary UUID for offline-created entities
  timestamp: Date;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  errorMessage?: string;
  userId?: string; // User who created the operation
}
