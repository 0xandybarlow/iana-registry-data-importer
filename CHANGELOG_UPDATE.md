## IANA Registry Data Updates

### OAuth Extensions Error Registry (oauth_registry/oauth_extensions_error_registry)
- Added: 19
- Removed: 2
- Modified: 1
  - entry_id=invalid_request
    - usage_location: "resource access error response" → "authorization endpoint, token endpoint, resource access error response"
    - protocol_extension: "bearer access token type" → "OAuth 2.0 Authorization Framework, bearer access token type"
    - reference: "RFC6750" → "RFC6749, RFC6750"

### OAuth Parameters (oauth_registry/oauth_parameters)
- Modified: 1
  - entry_id=trust_chain
    - reference: "Section 12.1.1.1.2 of OpenID Federation 1.0" → "Section 12.1.1.1.1 of OpenID Federation 1.0"

### OAuth Dynamic Client Registration Metadata (oauth_registry/oauth_dynamic_client_registration_metadata)
- Added: 4
- Removed: 1
- Modified: 1
  - entry_id=use_mtls_endpoint_aliases
    - client_metadata_description: "URL of a Web page for the organization owning this client" → "Boolean value indicating the requirement for a client to use mutual-TLS endpoint aliases RFC8705 declared by the authorization server in its metadata even beyond the Mutual-TLS Client Authentication and Certificate-Bound Access Tokens use cases."

### OAuth Authorization Server Metadata (oauth_registry/oauth_authorization_server_metadata)
- Added: 5
- Removed: 3

### JSON Web Key Types (jose_registry/json_web_key_types)
- Modified: 1
  - entry_id=AKP
    - key_type_description: "Algorithm Key Pair (TEMPORARY - registered 2025-04-24, expires 2026-04-24)" → "Algorithm Key Pair"
    - reference: "draft-ietf-cose-dilithium-06" → "RFC-ietf-cose-dilithium-10"

### JSON Web Key Parameters (jose_registry/json_web_key_parameters)
- Modified: 2
  - entry_id=priv
    - parameter_description: "Private key (TEMPORARY - registered 2025-07-24, expires 2026-07-24)" → "Private key"
    - reference: "draft-ietf-cose-dilithium-08" → "RFC-ietf-cose-dilithium-10"
  - entry_id=pub
    - parameter_description: "Public key (TEMPORARY - registered 2025-04-24, expires 2026-04-24)" → "Public key"
    - reference: "draft-ietf-cose-dilithium-06" → "RFC-ietf-cose-dilithium-10"

### JSON Web Token Claims (jwt_registry/json_web_token_claims)
- Added: 20
- Modified: 6
  - entry_id=_sd
    - reference: "RFC-ietf-oauth-selective-disclosure-jwt-22 - Section 4.2.4.1" → "RFC9901 - Section 4.2.4.1"
  - entry_id=_sd_alg
    - reference: "RFC-ietf-oauth-selective-disclosure-jwt-22 - Section 4.1.1" → "RFC9901 - Section 4.1.1"
  - entry_id=...
    - reference: "RFC-ietf-oauth-selective-disclosure-jwt-22 - Section 4.2.4.2" → "RFC9901 - Section 4.2.4.2"
  - entry_id=producerNsiList
    - claim_description: "List of NSIs of the NF service produce" → "List of NSIs of the NF service producer which are authorized for the NF service consumer"
  - entry_id=producerSnssaiList
    - claim_description: "List of S-NSSAIs of the NF service producer" → "list of S-NSSAIs of the NF service producer which are authorized for the NF service consumer"
  - entry_id=sd_hash
    - reference: "RFC-ietf-oauth-selective-disclosure-jwt-22 - Section 4.3" → "RFC9901 - Section 4.3"
