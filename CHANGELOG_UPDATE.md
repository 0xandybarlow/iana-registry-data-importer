## IANA Registry Data Updates

### OAuth URI (oauth_registry/oauth_uri)
- Modified: 4
  - entry_id=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
    - reference: "RFC7523" → "RFC7523, RFC-ietf-oauth-rfc7523bis-11"
  - entry_id=urn:ietf:params:oauth:client-assertion-type:saml2-bearer
    - reference: "RFC7522" → "RFC7522, RFC-ietf-oauth-rfc7523bis-11"
  - entry_id=urn:ietf:params:oauth:grant-type:jwt-bearer
    - reference: "RFC7523" → "RFC7523, RFC-ietf-oauth-rfc7523bis-11"
  - entry_id=urn:ietf:params:oauth:grant-type:saml2-bearer
    - reference: "RFC7522" → "RFC7522, RFC-ietf-oauth-rfc7523bis-11"

### OAuth Dynamic Client Registration Metadata (oauth_registry/oauth_dynamic_client_registration_metadata)
- Added: 1

### OAuth Token Endpoint Authentication Methods (oauth_registry/oauth_token_endpoint_authentication_methods)
- Modified: 2
  - entry_id=client_secret_jwt
    - change_controller: "OpenID_Foundation_Artifact_Binding_WG" → "IESG"
    - reference: "OpenID Connect Core 1.0 incorporating errata set 1" → "OpenID Connect Core 1.0 - Section 9, RFC-ietf-oauth-rfc7523bis-11"
  - entry_id=private_key_jwt
    - change_controller: "OpenID_Foundation_Artifact_Binding_WG" → "IESG"
    - reference: "OpenID Connect Core 1.0 incorporating errata set 1" → "OpenID Connect Core 1.0 - Section 9, RFC-ietf-oauth-rfc7523bis-11"

### JSON Web Key Types (jose_registry/json_web_key_types)
- Modified: 1
  - entry_id=AKP
    - reference: "RFC-ietf-cose-dilithium-10" → "RFC9964"

### JSON Web Key Parameters (jose_registry/json_web_key_parameters)
- Modified: 2
  - entry_id=priv
    - reference: "RFC-ietf-cose-dilithium-10" → "RFC9964"
  - entry_id=pub
    - reference: "RFC-ietf-cose-dilithium-10" → "RFC9964"
