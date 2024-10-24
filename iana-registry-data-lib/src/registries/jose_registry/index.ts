import JsonWebEncryptionCompressionAlgorithms from './json_web_encryption_compression_algorithms.json';
import JsonWebKeyEllipticCurve from './json_web_key_elliptic_curve.json';
import JsonWebKeyOperations from './json_web_key_operations.json';
import JsonWebKeyParameters from './json_web_key_parameters.json';
import JsonWebKeySetParameters from './json_web_key_set_parameters.json';
import JsonWebKeyTypes from './json_web_key_types.json';
import JsonWebKeyUse from './json_web_key_use.json';

export class JOSERegistry {
  public static JsonWebEncryptionCompressionAlgorithms = JsonWebEncryptionCompressionAlgorithms;
  public static JsonWebKeyEllipticCurve = JsonWebKeyEllipticCurve;
  public static JsonWebKeyOperations = JsonWebKeyOperations;
  public static JsonWebKeyParameters = JsonWebKeyParameters;
  public static JsonWebKeySetParameters = JsonWebKeySetParameters;
  public static JsonWebKeyTypes = JsonWebKeyTypes;
  public static JsonWebKeyUse = JsonWebKeyUse;
}