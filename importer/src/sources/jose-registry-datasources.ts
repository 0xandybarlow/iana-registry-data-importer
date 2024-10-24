import { RegistryMetadata } from '../interfaces/RegistryMetadata';

export const joseRegistryDatasources: RegistryMetadata[] = [
  {
    name: 'JSON Web Encryption Compression Algorithms',
    url: 'https://www.iana.org/assignments/jose/web-encryption-compression-algorithms.csv',
    required_specifications: ['RFC7518'],
  },
  {
    name: 'JSON Web Key Types',
    url: 'https://www.iana.org/assignments/jose/web-key-types.csv',
    required_specifications: ['RFC7518', 'RFC7638'],
  },
  {
    name: 'JSON Web Key Elliptic Curve',
    url: 'https://www.iana.org/assignments/jose/web-key-elliptic-curve.csv',
    required_specifications: ['RFC7518', 'RFC7638'],
  },
  {
    name: 'JSON Web Key Parameters',
    url: 'https://www.iana.org/assignments/jose/web-key-parameters.csv',
    required_specifications: ['RFC7517', 'RFC7638'],
  },
  {
    name: 'JSON Web Key Use',
    url: 'https://www.iana.org/assignments/jose/web-key-use.csv',
    required_specifications: ['RFC7517'],
  },
  {
    name: 'JSON Web Key Operations',
    url: 'https://www.iana.org/assignments/jose/web-key-operations.csv',
    required_specifications: ['RFC7517'],
  },
  {
    name: 'JSON Web Key Set Parameters',
    url: 'https://www.iana.org/assignments/jose/web-key-set-parameters.csv',
    required_specifications: ['RFC7517'],
  },
];
