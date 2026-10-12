## IANA Registry Data Updates

### OAuth Access Token Types (oauth_registry/oauth_access_token_types)
- Modified: 1
  - entry_id=PoP
    - additional_token_endpoint_response_parameters: "cnf, rs_cnf (see section 3.1 of RFC8747 and section 3.2 of RFC9201)." → "cnf, rs_cnf (see RFC8747 - Section 3.1 and RFC9201 - Section 3.2)."

### OAuth Dynamic Client Registration Metadata (oauth_registry/oauth_dynamic_client_registration_metadata)
- Added: 22

### PKCE Code Challenge Methods (oauth_registry/pkce_code_challenge_methods)
- Modified: 2
  - entry_id=plain
    - reference: "Section 4.2 of RFC7636" → "RFC7636 - Section 4.2"
  - entry_id=S256
    - reference: "Section 4.2 of RFC7636" → "RFC7636 - Section 4.2"

### OAuth Authorization Server Metadata (oauth_registry/oauth_authorization_server_metadata)
- Added: 2

### JSON Web Encryption Compression Algorithms (jose_registry/json_web_encryption_compression_algorithms)
- Modified: 1
  - entry_id=DEF
    - reference: "RFC7516" → "RFC 7516"

### JSON Web Key Types (jose_registry/json_web_key_types)
- Modified: 5
  - entry_id=AKP
    - reference: "RFC9964" → "RFC 9964"
  - entry_id=EC
    - reference: "RFC7518 - Section 6.2" → "RFC 7518 - Section 6.2"
  - entry_id=oct
    - reference: "RFC7518 - Section 6.4" → "RFC 7518 - Section 6.4"
  - entry_id=OKP
    - reference: "RFC8037 - Section 2" → "RFC 8037 - Section 2"
  - entry_id=RSA
    - reference: "RFC7518 - Section 6.3" → "RFC 7518 - Section 6.3"

### JSON Web Key Elliptic Curve (jose_registry/json_web_key_elliptic_curve)
- Modified: 8
  - entry_id=Ed25519
    - reference: "RFC8037 - Section 3.1" → "RFC 8037 - Section 3.1"
  - entry_id=Ed448
    - reference: "RFC8037 - Section 3.1" → "RFC 8037 - Section 3.1"
  - entry_id=P-256
    - reference: "RFC7518 - Section 6.2.1.1" → "RFC 7518 - Section 6.2.1.1"
  - entry_id=P-384
    - reference: "RFC7518 - Section 6.2.1.1" → "RFC 7518 - Section 6.2.1.1"
  - entry_id=P-521
    - reference: "RFC7518 - Section 6.2.1.1" → "RFC 7518 - Section 6.2.1.1"
  - entry_id=secp256k1
    - reference: "RFC8812 - Section 3.1" → "RFC 8812 - Section 3.1"
  - entry_id=X25519
    - reference: "RFC8037 - Section 3.2" → "RFC 8037 - Section 3.2"
  - entry_id=X448
    - reference: "RFC8037 - Section 3.2" → "RFC 8037 - Section 3.2"

### JSON Web Key Parameters (jose_registry/json_web_key_parameters)
- Modified: 27
  - entry_id=alg
    - reference: "RFC7517 - Section 4.4" → "RFC 7517 - Section 4.4"
  - entry_id=crv
    - reference: "RFC8037 - Section 2" → "RFC 8037 - Section 2"
  - entry_id=d
    - reference: "RFC8037 - Section 2" → "RFC 8037 - Section 2"
  - entry_id=dp
    - reference: "RFC7518 - Section 6.3.2.4" → "RFC 7518 - Section 6.3.2.4"
  - entry_id=dq
    - reference: "RFC7518 - Section 6.3.2.5" → "RFC 7518 - Section 6.3.2.5"
  - entry_id=e
    - reference: "RFC7518 - Section 6.3.1.2" → "RFC 7518 - Section 6.3.1.2"
  - entry_id=exp
    - parameter_description: "Expiration Time, as defined in RFC7519" → "Expiration Time, as defined in RFC 7519"
  - entry_id=iat
    - parameter_description: "Issued At, as defined in RFC7519" → "Issued At, as defined in RFC 7519"
  - entry_id=k
    - reference: "RFC7518 - Section 6.4.1" → "RFC 7518 - Section 6.4.1"
  - entry_id=key_ops
    - reference: "RFC7517 - Section 4.3" → "RFC 7517 - Section 4.3"
  - entry_id=kid
    - reference: "RFC7517 - Section 4.5" → "RFC 7517 - Section 4.5"
  - entry_id=kty
    - reference: "RFC7517 - Section 4.1" → "RFC 7517 - Section 4.1"
  - entry_id=n
    - reference: "RFC7518 - Section 6.3.1.1" → "RFC 7518 - Section 6.3.1.1"
  - entry_id=nbf
    - parameter_description: "Not Before, as defined in RFC7519" → "Not Before, as defined in RFC 7519"
  - entry_id=oth
    - reference: "RFC7518 - Section 6.3.2.7" → "RFC 7518 - Section 6.3.2.7"
  - entry_id=p
    - reference: "RFC7518 - Section 6.3.2.2" → "RFC 7518 - Section 6.3.2.2"
  - entry_id=priv
    - reference: "RFC9964" → "RFC 9964"
  - entry_id=pub
    - reference: "RFC9964" → "RFC 9964"
  - entry_id=q
    - reference: "RFC7518 - Section 6.3.2.3" → "RFC 7518 - Section 6.3.2.3"
  - entry_id=qi
    - reference: "RFC7518 - Section 6.3.2.6" → "RFC 7518 - Section 6.3.2.6"
  - …and 7 more modifications

### JSON Web Key Use (jose_registry/json_web_key_use)
- Modified: 2
  - entry_id=enc
    - reference: "RFC7517 - Section 4.2" → "RFC 7517 - Section 4.2"
  - entry_id=sig
    - reference: "RFC7517 - Section 4.2" → "RFC 7517 - Section 4.2"

### JSON Web Key Operations (jose_registry/json_web_key_operations)
- Modified: 8
  - entry_id=decrypt
    - reference: "RFC7517 - Section 4.3" → "RFC 7517 - Section 4.3"
  - entry_id=deriveBits
    - reference: "RFC7517 - Section 4.3" → "RFC 7517 - Section 4.3"
  - entry_id=deriveKey
    - reference: "RFC7517 - Section 4.3" → "RFC 7517 - Section 4.3"
  - entry_id=encrypt
    - reference: "RFC7517 - Section 4.3" → "RFC 7517 - Section 4.3"
  - entry_id=sign
    - reference: "RFC7517 - Section 4.3" → "RFC 7517 - Section 4.3"
  - entry_id=unwrapKey
    - reference: "RFC7517 - Section 4.3" → "RFC 7517 - Section 4.3"
  - entry_id=verify
    - reference: "RFC7517 - Section 4.3" → "RFC 7517 - Section 4.3"
  - entry_id=wrapKey
    - reference: "RFC7517 - Section 4.3" → "RFC 7517 - Section 4.3"

### JSON Web Key Set Parameters (jose_registry/json_web_key_set_parameters)
- Modified: 1
  - entry_id=keys
    - reference: "RFC7517 - Section 5.1" → "RFC 7517 - Section 5.1"

### JSON Web Token Claims (jwt_registry/json_web_token_claims)
- Added: 4
- Modified: 1
  - entry_id=cmw
    - claim_description: "A RATS Conceptual Message Wrapper" → "RATS Conceptual Message Wrapper"
    - reference: "RFC-ietf-rats-msg-wrap-22 - Sections 3.1, 3.3" → "RFC9999 - Sections 3.1, 3.3"
