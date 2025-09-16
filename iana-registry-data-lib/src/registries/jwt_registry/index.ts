import { defineDataset } from '../../util/defineDataset';
import type { RegistryDatasetInput } from '../../util/defineDataset';
import type {
  JsonWebTokenClaimEntry,
  JwtConfirmationMethodEntry,
} from './types';

import json_web_token_claims_json from './json_web_token_claims.json';
import jwt_confirmation_methods_json from './jwt_confirmation_methods.json';

export const json_web_token_claims = defineDataset<JsonWebTokenClaimEntry>(
  json_web_token_claims_json satisfies RegistryDatasetInput<JsonWebTokenClaimEntry>,
);
export const jwt_confirmation_methods = defineDataset<JwtConfirmationMethodEntry>(
  jwt_confirmation_methods_json satisfies RegistryDatasetInput<JwtConfirmationMethodEntry>,
);

export type { JsonWebTokenClaimEntry, JwtConfirmationMethodEntry } from './types';
