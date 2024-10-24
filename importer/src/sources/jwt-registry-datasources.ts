import { RegistryMetadata } from '../interfaces/RegistryMetadata';

export const jwtRegistryDatasources: RegistryMetadata[] = [
  {
    name: 'JSON Web Token Claims',
    url: 'https://www.iana.org/assignments/jwt/claims.csv',
    required_specifications: ['RFC7519'],
  },
  {
    name: 'JWT Confirmation Methods',
    url: 'https://www.iana.org/assignments/jwt/confirmation-methods.csv',
    required_specifications: ['RFC7800'],
  },
];
