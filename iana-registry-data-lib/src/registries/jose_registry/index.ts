import { defineDataset } from '../../util/defineDataset';
import type { RegistryDatasetInput } from '../../util/defineDataset';
import type {
  JsonWebEncryptionCompressionAlgorithmEntry,
  JsonWebKeyEllipticCurveEntry,
  JsonWebKeyOperationEntry,
  JsonWebKeyParameterEntry,
  JsonWebKeySetParameterEntry,
  JsonWebKeyTypeEntry,
  JsonWebKeyUseEntry,
} from './types';

import json_web_encryption_compression_algorithms_json from './json_web_encryption_compression_algorithms.json';
import json_web_key_elliptic_curve_json from './json_web_key_elliptic_curve.json';
import json_web_key_operations_json from './json_web_key_operations.json';
import json_web_key_parameters_json from './json_web_key_parameters.json';
import json_web_key_set_parameters_json from './json_web_key_set_parameters.json';
import json_web_key_types_json from './json_web_key_types.json';
import json_web_key_use_json from './json_web_key_use.json';

export const json_web_encryption_compression_algorithms = defineDataset<
  JsonWebEncryptionCompressionAlgorithmEntry
>(
  json_web_encryption_compression_algorithms_json satisfies RegistryDatasetInput<
    JsonWebEncryptionCompressionAlgorithmEntry
  >,
);
export const json_web_key_elliptic_curve = defineDataset<JsonWebKeyEllipticCurveEntry>(
  json_web_key_elliptic_curve_json satisfies RegistryDatasetInput<JsonWebKeyEllipticCurveEntry>,
);
export const json_web_key_operations = defineDataset<JsonWebKeyOperationEntry>(
  json_web_key_operations_json satisfies RegistryDatasetInput<JsonWebKeyOperationEntry>,
);
export const json_web_key_parameters = defineDataset<JsonWebKeyParameterEntry>(
  json_web_key_parameters_json satisfies RegistryDatasetInput<JsonWebKeyParameterEntry>,
);
export const json_web_key_set_parameters = defineDataset<JsonWebKeySetParameterEntry>(
  json_web_key_set_parameters_json satisfies RegistryDatasetInput<JsonWebKeySetParameterEntry>,
);
export const json_web_key_types = defineDataset<JsonWebKeyTypeEntry>(
  json_web_key_types_json satisfies RegistryDatasetInput<JsonWebKeyTypeEntry>,
);
export const json_web_key_use = defineDataset<JsonWebKeyUseEntry>(
  json_web_key_use_json satisfies RegistryDatasetInput<JsonWebKeyUseEntry>,
);

export type {
  JsonWebEncryptionCompressionAlgorithmEntry,
  JsonWebKeyEllipticCurveEntry,
  JsonWebKeyOperationEntry,
  JsonWebKeyParameterEntry,
  JsonWebKeySetParameterEntry,
  JsonWebKeyTypeEntry,
  JsonWebKeyUseEntry,
} from './types';
