import type { RegistryEntry } from '../../types';

export interface JsonWebEncryptionCompressionAlgorithmEntry extends RegistryEntry {
  compression_algorithm_value: string;
  compression_algorithm_description: string;
  change_controller: string;
  reference: string;
}

export interface JsonWebKeyEllipticCurveEntry extends RegistryEntry {
  curve_name: string;
  curve_description: string;
  jose_implementation_requirements: string;
  change_controller: string;
  reference: string;
}

export interface JsonWebKeyOperationEntry extends RegistryEntry {
  key_operation_value: string;
  key_operation_description: string;
  change_controller: string;
  reference: string;
}

export interface JsonWebKeyParameterEntry extends RegistryEntry {
  parameter_name: string;
  parameter_description: string;
  used_with_kty_value: string;
  parameter_information_class: string;
  change_controller: string;
  reference: string;
}

export interface JsonWebKeySetParameterEntry extends RegistryEntry {
  parameter_name: string;
  parameter_description: string;
  change_controller: string;
  reference: string;
}

export interface JsonWebKeyTypeEntry extends RegistryEntry {
  kty_parameter_value: string;
  key_type_description: string;
  jose_implementation_requirements: string;
  change_controller: string;
  reference: string;
}

export interface JsonWebKeyUseEntry extends RegistryEntry {
  use_member_value: string;
  use_description: string;
  change_controller: string;
  reference: string;
}
