import type { RegistryEntry } from '../../types';

export interface JsonWebTokenClaimEntry extends RegistryEntry {
  claim_name: string;
  claim_description: string;
  change_controller: string;
  reference: string;
}

export interface JwtConfirmationMethodEntry extends RegistryEntry {
  confirmation_method_value: string;
  confirmation_method_description: string;
  change_controller: string;
  reference: string;
}
